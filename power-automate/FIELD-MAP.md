# SharePoint Create / Update — field map

List: **Wedding Room Planner**  
Keep **FormPayload** (Multiple lines of text) as full JSON backup.  
Flat columns below are for list views / Excel export — map them on **Create** and **Update** for both `saveDraft` and `submitFinal`.

After adding columns, open each in List settings and note `Field=` in the URL (internal name). Use **internal names** only in Filter Query / `body(...)?['...']`. In Create/Update UI, pick by **display name**.

Dates from the form payload are **ISO** `YYYY-MM-DD`. Phones are formatted `(XXX) XXX-XXXX`.

---

## Existing / core columns

| Display name | Suggested internal | Expression (payload path) |
|--------------|--------------------|---------------------------|
| Title | Title | `json(triggerBody())?['payload']?['couple_name']` |
| Draft ID | DraftID | `variables('DraftIDFinal')` or `outputs('DraftID')` / Submit: `outputs('DraftID_Submit')` |
| Status | Status | `draft` or `submitted` |
| Created at | Createdat | Create: `utcNow()` |
| Updated at | Updatedat | `utcNow()` |
| Submitted at | Submittedat | Submit only: `utcNow()` |
| Couple Name | CoupleName | `json(triggerBody())?['payload']?['couple_name']` |
| Wedding Date | WeddingDate | `json(triggerBody())?['payload']?['wedding_date']` |
| Email | Email | `json(triggerBody())?['payload']?['email']` |
| Phone | Phone | `json(triggerBody())?['payload']?['phone']` |
| FormPayload | FormPayload | `string(json(triggerBody())?['payload'])` |

Do **not** map the old single-line **Payload** column (255 limit).

---

## Priority columns (add these first)

| Display name | Type | Expression |
|--------------|------|------------|
| Complete By | Date and time (Date only) | `json(triggerBody())?['payload']?['complete_by']` |
| Gift bags | Single line / Choice Yes/No | `json(triggerBody())?['payload']?['bags_providing']` |
| Valet needed | Single line / Choice Yes/No | `json(triggerBody())?['payload']?['valet_needed']` |
| Valet payment | Single line | `json(triggerBody())?['payload']?['valet_payment']` |

---

## Flatten — contact & basics

| Display name | Type | Expression key under `payload` |
|--------------|------|--------------------------------|
| Wedding venue | Single line | `wedding_venue` |
| Ceremony time | Single line | `ceremony_time` |
| Reception venue | Single line | `reception_venue` |
| Reception time | Single line | `reception_time` |
| Group arrival | Date | `group_arrival` |
| Group departure | Date | `group_departure` |
| Weekend contact | Single line | `weekend_contact_name` |
| Weekend phone | Single line | `weekend_contact_phone` |

## Flatten — rooms / VIP

| Display name | Type | Key |
|--------------|------|-----|
| Anticipated rooms | Multiple lines | `anticipated_rooms` |
| Couple accommodations | Multiple lines | `couple_accommodations` |
| Getting ready needed | Single line | `getting_ready_needed` |
| Getting ready date | Date | `getting_ready_date` |
| Getting ready guests | Number | `getting_ready_guests` |
| Getting ready access | Single line | `getting_ready_access` |
| VIP names | Multiple lines | `vip_names` |
| Accessibility | Multiple lines | `accessibility` |

## Flatten — transport / valet / bags / brunch

| Display name | Type | Key |
|--------------|------|-----|
| Transport company | Single line | `transport_company` |
| Transport contact | Single line | `transport_contact` |
| Transport vehicles | Single line | `transport_vehicles` |
| Transport first pickup | Single line | `transport_first_pickup` |
| Transport additional | Single line | `transport_additional` |
| Transport return | Single line | `transport_return` |
| Transport venue | Single line | `transport_venue` |
| Valet other | Single line | `valet_other` |
| Valet vehicles | Number | `valet_vehicles` |
| Valet billing contact | Single line | `valet_billing_contact` |
| Valet billing instructions | Single line | `valet_billing_instructions` |
| Bags quantity | Number | `bags_quantity` |
| Bags delivery date | Date | `bags_delivery_date` |
| Bags delivery time | Single line | `bags_delivery_time` |
| Bags deliverer | Single line | `bags_deliverer` |
| Bags distribution | Multiple lines | `bags_distribution` |
| Brunch hosting | Single line | `brunch_hosting` |
| Brunch datetime | Single line | `brunch_datetime` |
| Brunch attendance | Number | `brunch_attendance` |
| Brunch menu submitted | Single line | `brunch_menu_submitted` |
| Brunch requests | Multiple lines | `brunch_requests` |

## Flatten — staff dates

| Display name | Type | Key |
|--------------|------|-----|
| Date room cutoff | Date | `date_room_cutoff` |
| Date menu due | Date | `date_menu_due` |
| Date vendor list | Date | `date_vendor_list` |
| Date gift bag | Date | `date_gift_bag` |
| Date getting ready | Date | `date_getting_ready` |

## Vendors (summary text)

| Display name | Type | Expression |
|--------------|------|------------|
| Vendors | Multiple lines | See Compose below |

**Compose `VendorsText` (before Create/Update):**

```text
join(xpath(xml(concat('<r>', join(json(concat('["', join(json(triggerBody())?['payload']?['vendors'], '","'), '"]')), '</r>')), ...))
```

Simpler approach in PA — **Compose** with Expression:

```text
string(json(triggerBody())?['payload']?['vendors'])
```

Or build a readable string in a Compose using `join` over an Apply to each — for v1, storing `string(json(...vendors))` is enough for Excel.

---

## Update item Id

```text
first(body('GetDraftItems')?['value'])?['ID']
```

(Submit: `GetSubmitItems`)

---

## loadDraft Response body

Use **FormPayload** and **DraftID** (not `Payload` / `Draft_x0020_ID`):

```text
json(concat('{"ok":true,"draft_id":"', first(body('GetByDraftID')?['value'])?['DraftID'], '","status":"', first(body('GetByDraftID')?['value'])?['Status'], '","payload":', first(body('GetByDraftID')?['value'])?['FormPayload'], '}'))
```
