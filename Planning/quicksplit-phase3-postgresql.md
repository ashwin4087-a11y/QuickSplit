# QuickSplit — Phase 3 (Revised): PostgreSQL Database Design

This replaces the MongoDB version entirely — not a translation, a re-derivation for a relational model. Every array-of-subdocuments from the Mongo schema becomes a real child table with a foreign key; every "reference this user" becomes an actual `REFERENCES users(id)` with an explicit cascade rule, decided on purpose rather than defaulted.

## Naming note before anything else: don't call the table `sessions`

SQLAlchemy's own core class is `sqlalchemy.orm.Session` — it's what `db: Session = Depends(get_db)` refers to in nearly every FastAPI endpoint you'll write. A domain model *also* called `Session` in the same codebase is a guaranteed source of import confusion and shadowing bugs. The product term "Session" stays exactly as-is in the UI and in conversation — only the table and the SQLAlchemy model get a disambiguated name: **`bill_sessions`** / `BillSession`. Nothing else about the design changes because of this, it's purely a naming decision.

## Enums

```sql
CREATE TYPE conversation_type      AS ENUM ('personal', 'group');
CREATE TYPE member_role            AS ENUM ('admin', 'member');
CREATE TYPE session_status         AS ENUM ('active', 'settled', 'archived');
CREATE TYPE receipt_status         AS ENUM ('processing', 'needs_review', 'confirmed', 'failed');
CREATE TYPE split_mode             AS ENUM ('proportional', 'equal');
CREATE TYPE suggestion_status      AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE notify_mode            AS ENUM ('group', 'individual');
CREATE TYPE settlement_row_status  AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE payment_status         AS ENUM ('pending', 'confirmed', 'rejected');
CREATE TYPE upi_app                AS ENUM ('gpay', 'phonepe', 'paytm', 'bhim');
CREATE TYPE message_type           AS ENUM ('text', 'image', 'expense_summary', 'system');
```
Native Postgres enums, not varchar + check constraint — trade-off worth naming: enums are self-documenting and reject bad data at the DB layer, but altering the value set later needs an Alembic migration that touches the type itself (`ALTER TYPE ... ADD VALUE`), which is slightly more ceremony than editing a check constraint. Given how stable these value sets are (they're all fixed by product decisions already made in Phases 1–4), the trade-off favors enums.

## Money: BIGINT, minor units, everywhere

Every amount column is `BIGINT`, storing paise, not rupees — carried over unchanged from the original NFR ("amounts stored in minor currency units, never floats, to avoid rounding errors"). `NUMERIC` would also avoid float error, but integer minor units keep every layer (Python, SQL, JSON over the wire) doing the same math the same way, with no decimal-precision decisions to make at each boundary.

## Tables

### users
```sql
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(120) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  avatar_url     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
`UNIQUE` on `email` already creates its own index — no separate index needed.

### conversations
```sql
CREATE TABLE conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             conversation_type NOT NULL,
  name             VARCHAR(160),                 -- null for personal
  created_by       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  last_message_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
`created_by` is `RESTRICT`: deleting the user who created a conversation shouldn't be able to silently take the whole thread with it.

### conversation_members
```sql
CREATE TABLE conversation_members (
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role             member_role NOT NULL DEFAULT 'member',
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX idx_conversation_members_user ON conversation_members (user_id);
```
Both sides `CASCADE`: a conversation membership row has no meaning without both the conversation and the user existing — this is a pure junction table, not a financial record.

### bill_sessions
```sql
CREATE TABLE bill_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  title               VARCHAR(160) NOT NULL,
  icon                VARCHAR(16),
  status              session_status NOT NULL DEFAULT 'active',
  created_by          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  completed_at        TIMESTAMPTZ,
  total_split_amount  BIGINT,          -- cached at completion, for History
  time_taken_seconds  INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bill_sessions_conversation ON bill_sessions (conversation_id);
CREATE INDEX idx_bill_sessions_status ON bill_sessions (status);   -- Home's "Active Sessions" query
```

### session_members
```sql
CREATE TABLE session_members (
  session_id  UUID NOT NULL REFERENCES bill_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, user_id)
);
CREATE INDEX idx_session_members_user ON session_members (user_id);
```
Kept separate from `conversation_members` on purpose — Phase 3's Mongo version flagged that a Session's participants can, in principle, diverge from the parent conversation's full membership (someone in the group chat but not at this particular dinner). This table is what makes that actually representable.

### receipts
```sql
CREATE TABLE receipts (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id             UUID NOT NULL UNIQUE REFERENCES bill_sessions(id) ON DELETE CASCADE,
  uploaded_by            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  image_url              TEXT,
  ocr_raw_text           TEXT,
  restaurant_name        VARCHAR(160),
  receipt_date           DATE,
  receipt_time           TIME,
  tax_amount             BIGINT NOT NULL DEFAULT 0,
  service_charge_amount  BIGINT NOT NULL DEFAULT 0,
  discount_amount        BIGINT NOT NULL DEFAULT 0,
  tip_amount             BIGINT NOT NULL DEFAULT 0,
  total_amount           BIGINT,
  confidence_restaurant  SMALLINT CHECK (confidence_restaurant BETWEEN 0 AND 100),
  confidence_total       SMALLINT CHECK (confidence_total BETWEEN 0 AND 100),
  confidence_tax         SMALLINT CHECK (confidence_tax BETWEEN 0 AND 100),
  status                 receipt_status NOT NULL DEFAULT 'processing',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
`session_id UNIQUE` enforces the 1:1 relationship (one receipt per Session) at the database level, not just in application logic.

### receipt_items
```sql
CREATE TABLE receipt_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id  UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  label       VARCHAR(160) NOT NULL,
  price       BIGINT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  confidence  SMALLINT CHECK (confidence BETWEEN 0 AND 100),
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_receipt_items_receipt ON receipt_items (receipt_id);
```
This is your `Receipt.items[]` example, made real — `receipt_items` rows, deleted automatically (`CASCADE`) if the parent receipt is ever deleted (e.g. a re-scan replacing a `failed` receipt).

### expenses
```sql
CREATE TABLE expenses (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id                    UUID NOT NULL UNIQUE REFERENCES bill_sessions(id) ON DELETE CASCADE,
  restaurant_name                VARCHAR(160),
  expense_date                   DATE,
  tax_split_mode                 split_mode NOT NULL DEFAULT 'proportional',
  service_charge_split_mode      split_mode NOT NULL DEFAULT 'proportional',
  created_by                     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### expense_paid_by
```sql
CREATE TABLE expense_paid_by (
  expense_id  UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount      BIGINT NOT NULL,
  PRIMARY KEY (expense_id, user_id)
);
```
Modeled as a table, not a single column, even though v1 only ever has one payer (per Phase 1's Who-Paid flow) — costs nothing now and doesn't foreclose split-payment ("Sarah and Ashwin both fronted part of it") later. `user_id` is `RESTRICT`: a user who fronted money for an expense can't be deleted out from under that financial record.

### expense_items
```sql
CREATE TABLE expense_items (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id                  UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  receipt_item_id              UUID REFERENCES receipt_items(id) ON DELETE SET NULL,
  label                       VARCHAR(160) NOT NULL,
  price                       BIGINT NOT NULL,
  ai_suggestion_confidence     SMALLINT CHECK (ai_suggestion_confidence BETWEEN 0 AND 100),
  ai_suggestion_status         suggestion_status,
  sort_order                   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_expense_items_expense ON expense_items (expense_id);
```
`receipt_item_id` is `SET NULL`, not `CASCADE` or `RESTRICT` — it's a traceability link back to the original OCR line ("this expense item came from that scanned line"), and it's nullable to begin with since manually-entered expenses (no receipt at all) need to work too. If the receipt item it points to ever disappears, the expense item should keep existing with the link simply cleared, not vanish.

### expense_item_assignments — who an item is actually split with right now
```sql
CREATE TABLE expense_item_assignments (
  expense_item_id  UUID NOT NULL REFERENCES expense_items(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (expense_item_id, user_id)
);
```

### expense_item_suggested_users — what the AI proposed (kept separate from the above on purpose)
```sql
CREATE TABLE expense_item_suggested_users (
  expense_item_id  UUID NOT NULL REFERENCES expense_items(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (expense_item_id, user_id)
);
```
Two junction tables instead of one with a `source` flag, mirroring the Mongo doc's reasoning exactly: accepting a suggestion is copying rows from this table into `expense_item_assignments`; a manual override afterward never has to touch the suggestion record, so "what did the AI say" and "what's actually true" never get tangled.

### expense_splits — stored, never recomputed
```sql
CREATE TABLE expense_splits (
  expense_id   UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_owed  BIGINT NOT NULL,
  PRIMARY KEY (expense_id, user_id)
);
```
`RESTRICT` on `user_id` — this is money someone owes; a user with an outstanding `expense_splits` row can't just be deleted. (See "still open" below — this implies a soft-delete/deactivation path for users that doesn't exist yet.)

### settlements
```sql
CREATE TABLE settlements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL UNIQUE REFERENCES bill_sessions(id) ON DELETE CASCADE,
  payer_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notify_mode  notify_mode NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### settlement_rows
```sql
CREATE TABLE settlement_rows (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id  UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount         BIGINT NOT NULL,
  status         settlement_row_status NOT NULL DEFAULT 'pending',
  paid_at        TIMESTAMPTZ,
  UNIQUE (settlement_id, user_id)
);
CREATE INDEX idx_settlement_rows_settlement ON settlement_rows (settlement_id);
```
This is exactly your `Settlement → SettlementRow` example — the table that makes the progress bar ("4/6 Paid") a simple `COUNT(*) WHERE status = 'paid'` instead of a recomputation.

### payments
```sql
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES bill_sessions(id) ON DELETE CASCADE,
  settlement_row_id    UUID REFERENCES settlement_rows(id) ON DELETE SET NULL,
  from_user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  to_user_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount              BIGINT NOT NULL,
  upi_app             upi_app,
  status              payment_status NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at         TIMESTAMPTZ
);
CREATE INDEX idx_payments_session_status ON payments (session_id, status);
```
`settlement_row_id` is `SET NULL` for the same reason as `expense_items.receipt_item_id` — it's a link, not the payment's reason for existing.

### messages
```sql
CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  session_id       UUID REFERENCES bill_sessions(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type             message_type NOT NULL,
  content          JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conversation_created ON messages (conversation_id, created_at);
CREATE INDEX idx_messages_session_created ON messages (session_id, created_at);
```
`content` stays `JSONB` deliberately, even in a relational schema — its shape genuinely varies by `type` (a text message, an expense-summary card, and a system event like "Sarah assigned Fries" have nothing in common structurally), and nothing about that content needs to be queried or joined against relationally. Forcing five nullable columns or five separate tables to avoid JSONB here would be normalizing something that was never relational data to begin with. This is the one deliberate exception to "everything becomes real tables."

### item_preferences
```sql
CREATE TABLE item_preferences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_name  VARCHAR(160) NOT NULL,
  item_label       VARCHAR(160) NOT NULL,
  times_ordered    INTEGER NOT NULL DEFAULT 1,
  last_ordered_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, restaurant_name, item_label)
);
CREATE INDEX idx_item_preferences_user_restaurant ON item_preferences (user_id, restaurant_name);
```

### guest_links
```sql
CREATE TABLE guest_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES bill_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  UNIQUE (session_id, user_id)
);
```

## Cascade-rule philosophy, stated once instead of repeated 15 times

- **`CASCADE`**: used wherever the child row has no independent meaning without its parent — junction tables, line items, receipt/expense/settlement children of a `bill_session`. Delete the session, everything hanging off it goes with it.
- **`RESTRICT`**: used wherever the foreign key points *at a user* from a financial record (`expense_splits`, `settlement_rows`, `payments`, `expense_paid_by`). You should never be able to delete a user and have their debts or payment history silently disappear.
- **`SET NULL`**: used for the two purely-traceability links (`expense_items.receipt_item_id`, `payments.settlement_row_id`) — losing the link is fine, losing the row it points from is not.

## Alembic migration order

FK dependencies mean tables have to migrate in roughly this order (parents before children):

```
users
conversations → conversation_members
bill_sessions → session_members
receipts → receipt_items
expenses → expense_paid_by, expense_items → expense_item_assignments, expense_item_suggested_users, expense_splits
settlements → settlement_rows
payments
messages
item_preferences
guest_links
```

## What's settled vs. still open

**Settled by this doc:**
- Full relational schema, every array from the Mongo version now a real child table with an explicit cascade rule
- `bill_sessions` naming to avoid the SQLAlchemy `Session` collision
- Money as `BIGINT` minor units throughout

**Genuinely still open:**
- **Users need a soft-delete path.** Every `RESTRICT` on a `user_id` foreign key is only safe if users are never hard-deleted once they have financial history — this schema assumes an `is_active` flag (or similar) gets added to `users` before deletion is exposed anywhere in the product, but that column isn't designed yet.
- The AI-suggestion columns (`expense_items.ai_suggestion_*`, `expense_item_suggested_users`) are schema-ready but still blocked on the same UI gap Phase 4 flagged — the item-assignment screen itself doesn't exist yet.
