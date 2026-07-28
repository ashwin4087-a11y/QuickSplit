# QuickSplit — Phase 5: Authentication & User Management (Revised)

Short phase — the User model and REST auth flow don't actually change under the Session model, since auth is orthogonal to Conversation vs. Session. The one real addition is authenticating the Socket.io connections introduced in Phase 2.

## 1. Scope recap

FR1 (register/log in) — unchanged from Phase 1's original and revised docs. Nothing about the Session pivot touches this requirement.

## 2. What already holds, unchanged

- `User` schema (Phase 3): `name`, `email` (unique, lowercase), `passwordHash`, `avatarUrl`, timestamps — the earlier architecture doc noted this was already implemented (`src/models/User.js`) matching this design exactly, and nothing in Phases 1–4's revisions touches it.
- Endpoints already built, per the original architecture doc:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Get a JWT |
| GET | `/users/me` | Yes | Get own profile |

- `requireAuth` middleware — verifies JWT, sets `req.userId` — carries forward as-is and still gates every protected REST route, including the new `sessions/` module from Phase 2.
- Passwords bcrypt-hashed, never stored plain. Not up for revisiting.

## 3. New: authenticating Socket.io connections

Phase 2 introduced a Socket.io layer for live item-assignment and settlement-progress updates. REST auth doesn't cover it automatically — a socket connection needs its own auth check before it's allowed to join a `session:<id>` room, or anyone with the room name could listen in on someone else's bill.

- Client sends the same JWT used for REST calls in the Socket.io handshake (`auth: { token }` on connection).
- A socket middleware — functionally `requireAuth`'s counterpart, not a rewrite of it — verifies the token once at connection time and attaches `socket.userId`.
- Room joins additionally check Session membership before allowing the join (the socket equivalent of `requireMembership`), so `socket.userId` has to actually be in `Session.members` before it can join `session:<id>`.

```
src/sockets/
  auth.js         # io.use(...) — verifies JWT on handshake
  index.js        # connection handler, membership-checked room join/leave
```

This is new code, not a new concept — it's the same two-step (who are you / are you allowed here) that `requireAuth` + `requireMembership` already do for REST, just needed once more for the persistent socket connection.

## 4. One addition worth calling out: avatar upload

`avatarUrl` already existed in the schema, but no endpoint populates it yet, and the mockups lean on avatars constantly (Home list, chat header, settlement rows). With Cloudinary now decided in Phase 2 for receipt images, the same integration covers profile photos:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| PATCH | `/users/me` | Yes | Update `name` and/or `avatarUrl` |

Upload itself (client → Cloudinary directly, or proxied through the backend) is a Phase 2-style implementation detail, not a new architectural decision — same pattern as receipt images.

## 5. What's still a gap

Settings screen (where profile editing would actually live) isn't among the 20 Stitch mockups — it's in the bottom nav bar but nothing behind it has been designed. Same category of gap as the item-assignment screen from Phase 4: fine to note and move past for now, but it'll need real design before this phase can be fully built, not just planned.
