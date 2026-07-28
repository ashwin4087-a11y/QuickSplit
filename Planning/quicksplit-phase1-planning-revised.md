# QuickSplit — Phase 1: Project Planning & Requirement Analysis (Revised)

This replaces the earlier Phase 1 doc. The core model has changed: the old plan was **Conversation-first with bill-splitting bolted on**; the new spec is **Session-first**, where a Session (a real-world event — "Saturday Night @ BBQ Nation") is the actual container for chat, receipts, OCR, assignments, split, settlement, and timeline. Conversations still exist (personal chats, the Inbox), but Sessions are the unit everything else hangs off.

## 1. Problem Statement (unchanged in spirit, sharper in framing)

Groups who eat out together hit the same friction every time: one person fronts the bill, nobody remembers who ordered what, receipts are annoying to read, tax/shared-item math is tedious, and "how much do I owe / who do I pay" turns into awkward back-and-forth.

**QuickSplit's premise, restated:** the conversation *is* the product. Nothing about managing the bill should feel like using finance software — scanning, splitting, and settling should feel like a natural continuation of the group chat, the way sending a photo or a reaction does.

Explicitly **not**: an expense tracker, a banking app, a Splitwise clone, anything that resembles a spreadsheet.

## 2. Target Users (unchanged)

- Friend groups who eat out regularly
- Roommates with recurring shared costs
- Trip groups with many one-off shared expenses over a short window

## 3. Goals (revised)

- Bill arrives → everyone knows what they owe, in under a minute, without leaving the chat
- Expense history lives inside the Session it happened in and stays fully reconstructable later (messages, receipt, assignments, split, payments, timeline — all preserved)
- Repeat splitting gets faster over time via AI-suggested item ownership, shown with a confidence score and always overridable
- The product should never require the user to think "I am now doing accounting" — every surfaced action (upload, split, remind, settle) should read as something that would naturally happen in a conversation after a meal

## 4. Functional Requirements (revised — AI suggestion and real-time are now core, not deferred)

| # | Requirement | Module |
|---|---|---|
| FR1 | User can register and log in | `auth` |
| FR2 | User can create a Session (event) inside a conversation or group | `sessions` |
| FR3 | User can send text/image/reaction messages inside a Session's chat | `messages` |
| FR4 | User can scan a receipt (camera or gallery) inside a Session | `receipts` |
| FR5 | System extracts restaurant, date/time, items, prices, tax, discount, tip, total, and a confidence score via OCR/AI | `receipts` |
| FR6 | Low-confidence fields are visually flagged; every field remains editable before confirming | `receipts` |
| FR7 | AI suggests a likely owner (or shared owners) per item with a confidence %; user can Accept, Reject, or manually reassign | `expenses` (AI layer) |
| FR8 | Participants see each other's assignment actions live inside the same Session ("Sarah assigned Fries") | `expenses` (realtime) |
| FR9 | System calculates each participant's owed amount including proportional or equal tax/discount/tip split | `expenses` |
| FR10 | Split review shows an expandable per-person card: items, shared items, tax, discount, final amount | `expenses` |
| FR11 | User answers "Who paid the restaurant?" — themself or another member — which determines settlement direction | `settlements` |
| FR12 | User chooses how to notify the group: post one message in the group, or send each participant a personalized message | `settlements` + `messages` |
| FR13 | Settlement messages open a UPI deep link (Google Pay / PhonePe / Paytm / BHIM) with recipient and amount prefilled | `payments` |
| FR14 | After returning from the UPI app, user confirms: Mark Paid / Later / Payment Failed | `payments` |
| FR15 | Session shows live settlement progress (e.g. "4 / 6 Paid") until everyone has settled | `settlements` |
| FR16 | On full settlement, Session moves to History with a completion summary (time taken, total split) and remains fully viewable | `sessions` |
| FR17 | Non-member can view their own balance via a shared read-only link | `guest-links` |
| FR18 | User can view real-time balance (owed vs. paid) per person and across all Sessions on a Balances screen | `balances` |

## 5. Non-Functional Requirements (one material change)

- **Real-time is now required, not deferred.** FR8 (live collaboration on item assignment) and FR15 (live settlement progress) can't be done credibly on poll-based refresh — this reverses the earlier Phase 1 decision to defer sockets. Flagging this now because it changes Phase 2's architecture choice materially: Socket.io or similar needs to be in scope from the backend-architecture phase, not bolted on later.
- **Security:** unchanged — hashed passwords, JWT auth, unguessable guest-link tokens.
- **Data integrity:** unchanged — minor currency units, splits stored at creation time and never recomputed retroactively.
- **Availability:** unchanged — OCR/AI calls are external and can be slow or fail; upload must never block the rest of the app (see the existing Phase 8 doc's async design, which still holds).
- **No real payment processing.** UPI deep links only — QuickSplit prefills and hands off to Google Pay/PhonePe/Paytm/BHIM, then asks the user to self-report the outcome. This is actually a *stronger* commitment to "no money moves through the app" than the old plan, since it's now a named, designed interaction (FR13/FR14) rather than an afterthought.

## 6. Scope for v1 (MVP) — proposed cut, since the full spec has no built-in phasing

The reference spec and the Stitch mockups describe the complete product, not a phased MVP. For an actual buildable v1, I'd propose:

**In scope for v1:**
- Auth, Sessions (create/join), chat (text + image)
- Receipt scan → OCR → review/edit → confirm
- AI item-suggestion with confidence score, accept/reject/manual override (this is now core per FR7, not deferred like the old plan had it)
- Manual + AI-assisted splitting, tax proportional/equal
- Who-paid branch, group settlement message only (defer individual personalized messages to v1.1)
- UPI deep link handoff + self-reported Mark Paid/Later/Failed
- Settlement progress bar, session completion + history

**Deferred past v1:**
- Live collaboration cursors/presence beyond simple "X assigned Y" system messages (full real-time presence UI is a stretch goal)
- Individual (per-person) settlement messages — group message covers the same data, individual is a refinement
- Multi-currency
- Push notifications/reminders beyond the in-Session progress bar

This is a judgment call, not something either source document states directly — flagging it so you can correct the cut if your priority order differs.

## 7. Assumptions & Constraints (revised)

- Single currency per Session (carried over from the old plan; nothing in the new spec contradicts it)
- No in-app money movement, ever — UPI deep link is the entire payment mechanism, confirmed by both the reference spec and the mockups ("Pay Now" opens GPay/PhonePe/BHIM)
- Design system is fixed: "Luminous Utility" — deep navy tonal stacking (`#0B1220` → `#243244`), emerald reserved for success/settle actions, indigo for interactive/selection states, Inter typeface throughout, hyper-rounded shapes. This is now a hard constraint on every future UI phase, not a suggestion.
- Built as a personal/learning project — same as before

## 8. Success Criteria for v1

A group can: sign up → start a Session → scan a receipt → get AI-assisted item assignment → review the split → answer who paid → post a group settlement → open UPI to pay → mark paid → watch the Session auto-complete and move to History — entirely inside the chat, without touching a database or a separate dashboard.
