# QuickSplit — Phase 3: Database Design (Revised for Sessions)

This supersedes the earlier Phase 3 doc. The shape of most collections survives, but two things change structurally: **Session** is a new top-level entity that most other collections now scope to instead of `Conversation`, and **Settlement stops being disposable** — flagging that reversal up front since the original doc was explicit about the opposite decision.

## Collections

### User — unchanged
```
User {
  _id
  name
  email            // unique, lowercase
  passwordHash
  avatarUrl
  createdAt, updatedAt
}
```

### Conversation — unchanged, but narrower in responsibility
```
Conversation {
  _id
  type: 'personal' | 'group'
  name              // null for personal
  members: [{ user, role, joinedAt }]
  createdBy
  lastMessageAt
}
```
Still the identity/membership container (a 1:1 thread with Ashwin, or the standing "Weekend Trip" group). What changes: it's no longer where bill-splitting activity lives. A Conversation can host ordinary chat and can spawn any number of Sessions over time — the group has one persistent Conversation but a new Session each time there's a bill to split.

### Session — new
```
Session {
  _id
  conversation          // parent thread
  title                 // "Saturday Night @ BBQ Nation"
  icon                  // emoji, e.g. 🍖
  members: [User]        // who's actually in on this particular bill — may be a subset of the conversation's members
  status: 'active' | 'settled' | 'archived'
  receipt               // ref, null until scanned
  expense                // ref, null until split is built
  settlement             // ref, null until "who paid" is answered
  createdBy, createdAt
  completedAt
  totalSplit             // cached at completion, for the History/celebration screen
  timeTakenSeconds        // cached at completion, same reason
}
```
This is the entity the Home "Active Sessions" list, the chat header pill ("ACTIVE SESSION"), and the History view are all actually querying.

### Message — one new field
```
Message {
  _id
  conversation
  session               // NEW — null for general conversation chat, set for anything posted inside a Session's thread
  sender
  type: 'text' | 'image' | 'expense_summary' | 'system'
  content: { ... shape depends on type }
  createdAt
}
```
`type: 'system'` now covers a wider set of generated events than before — item assigned, AI suggestion accepted, split finalized, settlement posted, payment confirmed, session completed. All of the 📷🤖🧾💸🎉 message examples from the spec are `system` messages with a `content.kind` discriminator, not new message types — keeps the schema from growing a type per event.

### Receipt — three new fields
```
Receipt {
  _id
  session               // was `conversation` — receipts now scope to a Session
  uploadedBy
  imageUrl
  ocrRawText
  restaurantName, date, time     // time is new — spec calls it out separately from date
  items: [{ label, price, quantity }]
  tax, serviceCharge, discount, tip, total     // discount/tip are new
  confidence: { restaurantName, items, tax, total, ... }   // NEW — per-field 0–100, drives the "flag uncertain fields" UI
  status: 'processing' | 'needs_review' | 'confirmed' | 'failed'
}
```

### Expense — one new field
```
Expense {
  _id
  session               // was `conversation`
  restaurantName, date
  participants: [User]
  paidBy: [{ user, amount }]
  items: [{
    label, price,
    assignedTo: [User],
    aiSuggestion: { users: [User], confidence, status: 'pending' | 'accepted' | 'rejected' }   // NEW
  }]
  taxSplit, serviceChargeSplit: 'proportional' | 'equal'
  splits: [{ user, amountOwed }]
  createdBy, createdAt
}
```
`aiSuggestion` lives per-item, separate from `assignedTo` — `assignedTo` is the actual current state (what the split math uses), `aiSuggestion` is what the model proposed and whether the user accepted, rejected, or overrode it. Keeping these separate means accepting a suggestion is just copying `aiSuggestion.users` into `assignedTo`, and a manual override afterward doesn't need to touch the suggestion record.

### Settlement — reversed from "disposable" to persistent

The original Phase 3 doc said: *"Settlement is intentionally left out... it's a generated/disposable snapshot, not a relationship that needs to be modeled."* That decision doesn't hold anymore. A Settlement now has to persist because the UI needs to track it over time — the progress bar ("4/6 Paid"), per-person Mark Paid state, and the who-paid/notify-mode choices all have to survive a page refresh and be queryable in History. It's no longer just a computed number at the moment of viewing.

```
Settlement {
  _id
  session
  payer                 // User who covered the restaurant bill
  notifyMode: 'group' | 'individual'
  rows: [{ user, amount, status: 'pending' | 'paid' | 'failed', paidAt }]
  createdAt
}
```

### Payment — one new field
```
Payment {
  _id
  session               // was `conversation`
  settlement             // NEW — which Settlement.row this confirms
  from, to
  amount
  upiApp                 // NEW, optional — 'gpay' | 'phonepe' | 'paytm' | 'bhim', for display only
  status: 'pending' | 'confirmed' | 'rejected'
  createdAt, confirmedAt
}
```

### ItemPreference, GuestLink — unchanged
```
ItemPreference { _id, user, restaurantName, itemLabel, timesOrdered, lastOrderedAt }
GuestLink { _id, session, user, token, expiresAt }     // note: session instead of conversation
```

## Indexes to add on top of the existing set

- `Session.conversation` — index, for "all sessions in this group"
- `Session.status` — index, since Home's "Active Sessions" query filters on this directly
- `Message.session` + `createdAt` — compound index, mirrors the existing `Message.conversation` + `createdAt` pattern, needed now that session-scoped chat is its own paginated view
- `Settlement.session` — index, unique (one settlement per session)
- `Payment.settlement` — index, for computing live progress without re-deriving it from scratch

## What's settled vs. still open

**Settled by this doc:**
- Session is the scoping entity for Receipt/Expense/Settlement/session-chat; Conversation stays as the lighter-weight membership/identity container
- Settlement is persistent, reversing the earlier decision
- AI item-suggestion is stored per-item, separate from the actual assignment

**Genuinely still open:**
- Whether `Session.members` can diverge from `Conversation.members` in practice (e.g. someone in the group chat but not at this particular dinner) — the schema supports it, but no phase doc has confirmed the UI actually lets you exclude someone from a Session
- Whether History needs its own denormalized read model once there are enough completed Sessions, or compute-on-read from the collections above stays fine — same "revisit when it matters" stance as the original balance-caching question
