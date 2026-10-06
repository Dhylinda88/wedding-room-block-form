# SharePoint Create / Update — what to paste in each field

Your list **Wedding Room Planner** columns (no **Complete By** column):

- Title  
- Draft ID  
- Status  
- Created at  
- Updated at  
- Submitted at  
- Couple Name  
- Wedding Date  
- Email  
- Phone  
- Payload  

The form’s **“complete by”** date (intro line) is **not** a list column. It is saved **inside Payload** as `complete_by` when the customer saves. You do not map it in Create/Update unless you add that column yourself later.

---

## Expressions (click field → fx → paste → Add)

Use these on **both** Create item and Update item (except where noted).

| SharePoint column | Expression |
|-------------------|------------|
| Title | `json(triggerBody())?['payload']?['couple_name']` |
| Draft ID | `outputs('DraftID')` |
| Status | type plain text: `draft` |
| Created at | **Create only:** `utcNow()` · **Update only:** `first(body('GetDraftItem')?['value'])?['Created_x0020_at']` |
| Updated at | `utcNow()` |
| Submitted at | leave **empty** for saveDraft |
| Couple Name | `json(triggerBody())?['payload']?['couple_name']` |
| Wedding Date | `json(triggerBody())?['payload']?['wedding_date']` |
| Email | `json(triggerBody())?['payload']?['email']` |
| Phone | `json(triggerBody())?['payload']?['phone']` |
| Payload | `string(json(triggerBody())?['payload'])` |

**Update item only — Id:**

```text
first(body('GetDraftItem')?['value'])?['ID']
```

Replace `GetDraftItem` if your Get items action has a different name.

---

## What Payload contains (JSON text)

Includes everything the customer filled, for example:

- `couple_name`, `wedding_date`, `email`, `phone`
- **`complete_by`** (intro deadline date)
- wedding venue, valet, vendors, brunch, etc.

Resume (`loadDraft`) reads **Payload** and puts all of that back into the form.
