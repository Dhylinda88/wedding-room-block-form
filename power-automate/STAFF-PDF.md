# Staff password, invite links, PDF on submit

## 1. Accept guest OR staff password

1. Add Compose **StaffPassword** (next to **FormPassword**) with your staff code (same value as `STAFF_PASSWORD` in `config.js`).
2. Change the top **Condition** from password equals FormPassword to **OR**:
   - `json(triggerBody())?['password']` **is equal to** `outputs('FormPassword')`
   - **OR** `json(triggerBody())?['password']` **is equal to** `outputs('StaffPassword')`
3. Optional: Unlock **200** body:
   ```text
   { "ok": true, "staff": @{equals(json(triggerBody())?['password'], outputs('StaffPassword'))} }
   ```

---

## 2. Invite URL (coordinator)

```text
https://Dhylinda88.github.io/wedding-room-block-form/?wedding_date=2026-06-15&complete_by=2026-05-16
```

- `wedding_date` / `complete_by`: `YYYY-MM-DD` or `MM/DD/YYYY`
- If `complete_by` omitted, form sets wedding − 30 days
- Add `&draft=...` when resuming an existing draft

---

## 3. Flatten SharePoint columns

See [FIELD-MAP.md](FIELD-MAP.md). Add priority columns first (Complete By, Gift bags, Valet needed, Valet payment), then remapping Create/Update. Re-add Create/Update after new columns so the connector schema refreshes.

---

## 4. PDF attachment on `submitFinal`

After SharePoint Create/Update succeeds, **before** staff email:

1. **Compose** `SubmitHtml` — HTML summary (sections + key fields from `json(triggerBody())?['payload']`).
2. **Create file** (OneDrive): folder e.g. `/WeddingRoomBlock`, name `@{outputs('DraftID_Submit')}.html`, body = Compose output.
3. **Convert file** (OneDrive): target PDF.
4. **Send an email (V2) Submit**: attach the PDF content from Convert file; keep existing To/Subject/Body.
5. **200 Submit** → **Configure run after**: Succeeded / Failed / Timed out / Skipped on the email step so the couple still gets `{ "ok": true }` if Outlook/PDF fails.

Guest save email: no PDF required.

---

## 5. Frontend config

In `config.js`:

- `STAFF_PASSWORD` — live staff code (change from `CHANGE_ME_STAFF`)
- `MOCK_STAFF_PASSWORD` — mock only (`staff` by default)
