# QuickSplit — Phase 4: UI/UX Design & User Flow (Revised)

This supersedes the earlier Phase 2 UI/UX doc. That version was written before any screens existed, for the Conversation-first model. This version documents what's actually been designed — 20 Stitch screens under the "Luminous Utility" system — against the Session-first flow from Phases 1–3. It's cataloguing and reconciling, not designing from a blank page.

## Screen inventory (as built)

| Screen | File(s) | Purpose | Notes |
|---|---|---|---|
| Home / Sessions inbox | `home_inbox`, `home_inbox_refined_sessions`, `home_sessions_progress_overview`, `home_hero_focus_settlements_navigation` | Lists Active Sessions and Archived ones, each showing latest activity | Four iterations exist — see "Which home screen wins" below |
| Chat session | `chat_experience`, `chat_session_saturday_night_bbq_nation`, `chat_session_story_human_moments` | The Session's own thread — messages, system events, the expense card | Three iterations, same reconciliation issue |
| Receipt review | `receipt_review`, `receipt_review_refined_ocr` | OCR output, editable fields, confidence flagging | Refined version adds the "OCR VERIFIED" badge and per-field edit pencils |
| Finalize split selection | `finalize_split_selection` | Confirms the split before moving to who-paid | Sits between item-assignment and Who Paid in the flow |
| Who paid selection | `who_paid_selection` | FR11 — "I paid" vs "Someone else paid" with member picker | Matches Phase 1's spec exactly |
| Group settlement message | `group_settlement_message` | Posted-in-chat settlement card, Pay Now CTA | This is the `system` message content from Phase 3 |
| Individual settlement message | `individual_settlement_message` | Personalized per-recipient version of the same card | Deferred past v1 per Phase 1 §6, but already designed |
| Group settlement summary | `group_settlement_summary` | Full breakdown view, reached via "View Split Detail" | |
| Participant settlement card | `participant_settlement_card` | Single person's row, expandable | |
| Settlement card (personal, transparent) | `settlement_card_personal_transparent` | Variant treatment of the same card | |
| Balances / Settle up | `balances_settle_up`, `balances_settle_up_refined_wallet` | Net balance, suggested payments, per-member balance bars | "Refined wallet" version adds the hero net-balance card and UPI app row |
| Payment confirmation | `payment_confirmation` | Mark Paid / Later / Payment Failed, after returning from UPI app | FR14 |
| Session complete celebration | `session_complete_settlement_celebration` | Time taken, total split, Back to Dashboard / View History | FR16 |

**Not yet designed, still needed:** Sign up/log in, Session creation, item-assignment screen itself (the AI-suggestion accept/reject interaction from FR7 isn't in any of the 20 screens — receipt review jumps straight to "Looks Good," and the next artifact is Finalize Split). This is the one real gap to flag before build starts.

## Which home/chat screen wins

Four Home variants and three Chat variants exist under different names, which reads like iterative refinement passes rather than four intentionally different screens. Before Phase 5+ build starts, these need to collapse to one canonical version each — right now a builder wouldn't know which to implement. My read, based on file names and the design system's own emphasis on "calm authority" over density:

- **Home:** `home_sessions_progress_overview` looks like the most complete version (it's positioned as a later refinement over `home_inbox_refined_sessions`, which itself refined the original `home_inbox`) — but this is inferred from naming, not confirmed.
- **Chat:** `chat_session_saturday_night_bbq_nation` is the one referenced by name throughout this project's examples, so treating it as canonical unless told otherwise.

Flagging both rather than silently picking, since guessing wrong here means every downstream build reference points at the wrong screen.

## Navigation structure (revised)

```
Home (Sessions list: Active / Archived)
 ├─ Tap a Session → Chat (session-scoped thread)
 │    ├─ Scan Receipt → OCR processing → Receipt review → [Item assignment — gap, see above]
 │    │    → Finalize split → Who paid? → Notify mode → (posts) Settlement message in chat
 │    ├─ Settlement message → Pay Now (UPI deep link) → back to app → Payment confirmation
 │    └─ All settled → Session complete celebration → moves to History (Archived)
 ├─ Balances tab → net balance, suggested payments, per-member balances
 ├─ Split tab (bottom nav) → shortcut into "start a Session" / scan flow
 └─ Settings tab
```

Bottom tab bar (Inbox / Balances / Split / Settings) is new versus the old flat nav — the earlier doc's "everything is 2–3 taps from chat" principle still holds, it's just now expressed as persistent tabs instead of a single stack.

## Design principles — carried forward and one addition

The three original principles still apply verbatim: never leave the chat to act, show computed numbers live, every AI-parsed value stays editable until confirmed. One addition, drawn directly from the Luminous Utility system rather than restated from the old doc:

4. **Every AI suggestion states its confidence and its state (Pending / Accepted / Rejected) — never presents a guess as fact.** This is what the OCR review's confidence flagging and the (not-yet-built) item-assignment screen's "🤖 Likely Sarah · 92%" pattern have in common — it's a single UI principle, not two separate features.

## What's settled vs. still open

**Settled by this doc:**
- The 12-screen set above maps cleanly onto the Session flow from Phases 1–3, with one gap identified

**Still open, blocking Phase 5+:**
- Canonical Home and Chat screen — pick one of each before anything gets built against them
- Item-assignment screen doesn't exist yet — needs actual design, not just documentation, before Phase 9 (Expense Management) can be built against it
