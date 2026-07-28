# QuickSplit — Phase 2: System Architecture & Technology Stack

## 1. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Client | React (web), same component patterns portable to React Native later | Matches the mockups already built as HTML/CSS references; component reuse across Session screens |
| Backend | Node.js + Express | Already the established pattern from the earlier architecture doc — routes/controllers/models, `requireAuth`/`requireMembership` — carries forward unchanged |
| Database | MongoDB (Mongoose) | Unchanged from Phase 3's schema work; document model fits nested structures like `Expense.items` and `Expense.splits` well |
| Real-time | Socket.io | Resolves the NFR flagged in Phase 1 — needed for live item-assignment updates and live settlement progress |
| OCR/AI | Vision-capable LLM (structured JSON output) | One call does extraction *and* structuring into the `Receipt.items` shape, including a confidence score per field — matches FR5/FR6/FR7's need for AI-suggested ownership, not just OCR |
| Image storage | Cloudinary | Resolves the open question from the Phase 8 draft — free tier is enough for a learning project, built-in image transforms (thumbnails for chat bubbles) save building that ourselves |
| Auth | JWT, bcrypt-hashed passwords | Unchanged |
| Payments | UPI deep links (`upi://pay?...`), no payment backend | Unchanged — confirmed no money moves through QuickSplit itself |
| Hosting | Render/Railway (backend), MongoDB Atlas, Vercel (client) | Free-tier-friendly for a learning project; swap later if it needs to scale |

## 2. High-level architecture

```
┌─────────────┐        HTTPS/REST         ┌──────────────────┐
│   Client    │ ───────────────────────▶  │   Express API    │
│  (React)    │ ◀───────────────────────  │  routes/controllers/models │
└─────────────┘        WebSocket           └──────────────────┘
       ▲                                            │
       │        Socket.io (Session rooms)           │
       └────────────────────────────────────────────┘
                                                      │
                              ┌───────────────────────┼───────────────────────┐
                              ▼                       ▼                       ▼
                        MongoDB Atlas          Cloudinary            Vision LLM API
                        (all collections)     (receipt images)      (OCR + structuring)
```

Two channels between client and server, not one: REST for anything request/response shaped (create a Session, confirm a receipt, post a message), Socket.io for anything that needs to fan out to everyone currently in a Session (item assignment updates, settlement progress, "X is typing").

## 3. Real-time design

- One Socket.io **room per Session** (`session:<id>`), joined on entering the Session screen, left on exit.
- Events are additive, not authoritative — the socket layer broadcasts what already happened via a REST call (e.g. `PATCH /sessions/:id/items/:itemId/assign` triggers both the DB write *and* an `item:assigned` emit to the room). Socket.io is never the only place a state change happens — if a client reconnects, a REST `GET` still returns the full correct state. This avoids the classic bug where realtime and REST state drift apart.
- Server-side: a thin `sockets/` layer that mounts alongside the existing `modules/` folders, subscribing to the same controllers rather than duplicating logic.

```
src/
  sockets/
    index.js          # io.on('connection', ...), room join/leave
    sessionEvents.js   # emits fired from controllers after a successful write
```

## 4. OCR/AI integration design

- Single endpoint call per receipt: image → vision LLM with a prompt constraining output to the `Receipt` schema shape (restaurant, date, time, items[], tax, discount, tip, total) plus a `confidence` object per field.
- Confidence scores below a threshold (proposed: 80%) get flagged in the review UI — this is what the mockups show as fields needing a visible highlight.
- The same call (or a lightweight follow-up call once participants are known) also returns the item-ownership suggestions with confidence — powering FR7. This keeps OCR and AI-suggestion as one integration rather than two separate services, consistent with the Phase 8 draft's reasoning.
- Runs async per the existing Phase 8 pattern (`processing` → `needs_review`/`failed`), now additionally emitting a socket event (`receipt:processed`) so anyone else in the Session sees the review screen populate without polling.

## 5. What carries forward unchanged

The three-layer module pattern (`routes` → `controller` → `model`), the `requireAuth`/`requireMembership` middleware stack, and the response/error/status-code conventions from the earlier architecture doc all still apply — Sessions are just another module (`sessions/`) following the same shape as `conversations/` did. Nothing about that pattern is invalidated by the new spec; it's additive.

## 6. Open decision for you

Vision-LLM provider isn't picked yet (Anthropic vs. others) — same open item as the Phase 8 draft, now formally part of the architecture rather than a footnote. Worth deciding before Phase 5–8 build-out starts, since the prompt/response contract is shared across receipt review and AI item-suggestion.
