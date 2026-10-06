# SharePoint Create / Update — field map (refined)

List: **Wedding Room Planner**  
Keep **FormPayload** (Multiple lines of text) as full JSON backup for resume.  
Flat columns below are for list views / Excel. Map on **Create** and **Update** for `saveDraft` and `submitFinal`.

Form payload keys are under `json(triggerBody())?['payload']?['…']`.  
Dates in payload are ISO `YYYY-MM-DD`. Phones are `(XXX) XXX-XXXX`.

After adding a column, check List settings → column → URL `Field=` for the **internal name**.

---

## Core (already have)

| Display name | Type | Expression |
|--------------|------|------------|
| Title | Single line | `json(triggerBody())?['payload']?['couple_name']` |
| Draft ID | Single line | Save: `variables('DraftIDFinal')` · Submit: `outputs('DraftID_Submit')` |
| Status | Single line | `draft` / `submitted` |
| Created at | Single line (or Date) | Create: `utcNow()` |
| Updated at | Single line (or Date) | `utcNow()` |
| Submitted at | Single line (or Date) | Submit: `utcNow()` |
| Couple Name | Single line | `json(triggerBody())?['payload']?['couple_name']` |
| Wedding Date | Date only (or Single line) | `json(triggerBody())?['payload']?['wedding_date']` |
| Email | Single line | `json(triggerBody())?['payload']?['email']` |
| Phone | Single line | `json(triggerBody())?['payload']?['phone']` |
| FormPayload | Multiple lines (plain) | `string(json(triggerBody())?['payload'])` |
| Complete By | Date only | `json(triggerBody())?['payload']?['complete_by']` |

Do **not** map old 255-char **Payload**.

---

## Priority / ops columns

| Display name | Type | Choices / notes | Expression |
|--------------|------|-----------------|------------|
| Valet needed | **Choice** | `yes`, `no` | `json(triggerBody())?['payload']?['valet_needed']` |
| Valet payment | **Choice** | `individual`, `hosted`, `master`, `other` (labels in list: Individual guest / Hosted by couple-family / Master account / Other) | `json(triggerBody())?['payload']?['valet_payment']` |
| Valet vehicles | **Number** | | `json(triggerBody())?['payload']?['valet_vehicles']` |
| Valet details | Multiple lines | Combine “if other” + billing contact + billing instructions | Compose then map (see below) |
| Gift bags | **Choice** | `yes`, `no` — ignore quantity column for now if you want; or add Bags quantity later | `json(triggerBody())?['payload']?['bags_providing']` |

**Compose `ValetDetails` (before Create/Update):** use text with dynamics:

```text
Other: @{json(triggerBody())?['payload']?['valet_other']}
Billing contact: @{json(triggerBody())?['payload']?['valet_billing_contact']}
Instructions: @{json(triggerBody())?['payload']?['valet_billing_instructions']}
```

Map **Valet details** → `outputs('ValetDetails')`.

---

## Wedding basics

| Display name | Type | Expression key |
|--------------|------|----------------|
| Wedding venue | Single line | `wedding_venue` |
| Ceremony time | Single line (time from form) | `ceremony_time` |
| Reception venue | Single line | `reception_venue` |
| Reception time | Single line | `reception_time` |
| Group arrival | Date only | `group_arrival` |
| Group departure | Date only | `group_departure` |
| Weekend contact | Single line | `weekend_contact_name` |
| Weekend phone | Single line | `weekend_contact_phone` |

Note: form ceremony/reception are **time** inputs (`HH:mm`), not full date/time. Store as Single line text unless you change the form later.

---

## Rooms / VIP

| Display name | Type | Expression key |
|--------------|------|----------------|
| Anticipated rooms | Multiple lines | `anticipated_rooms` |
| Couple accommodations | Multiple lines | `couple_accommodations` |
| Getting ready needed | **Choice** yes/no | `getting_ready_needed` |
| Getting ready date | Date only | `getting_ready_date` |
| Getting ready guests | Number | `getting_ready_guests` |
| Getting ready access | Single line | `getting_ready_access` |
| VIP names | Multiple lines | `vip_names` |
| Accessibility | Multiple lines | `accessibility` |

---

## Transport (one blob)

| Display name | Type | How to fill |
|--------------|------|-------------|
| Transportation | Multiple lines | Compose `TransportBlock` (below) → `outputs('TransportBlock')` |

**Compose `TransportBlock` text:**

```text
Company: @{json(triggerBody())?['payload']?['transport_company']}
Contact: @{json(triggerBody())?['payload']?['transport_contact']}
Vehicles: @{json(triggerBody())?['payload']?['transport_vehicles']}
First pickup: @{json(triggerBody())?['payload']?['transport_first_pickup']}
Additional: @{json(triggerBody())?['payload']?['transport_additional']}
Return: @{json(triggerBody())?['payload']?['transport_return']}
Venue: @{json(triggerBody())?['payload']?['transport_venue']}
```

---

## Brunch

| Display name | Type | Expression |
|--------------|------|------------|
| Brunch hosting | **Choice** yes/no | `json(triggerBody())?['payload']?['brunch_hosting']` |
| Brunch datetime | **Date and time** (date + time) | `json(triggerBody())?['payload']?['brunch_datetime']` — form sends `YYYY-MM-DDTHH:mm` from `datetime-local` |
| Brunch attendance | Number | `json(triggerBody())?['payload']?['brunch_attendance']` |
| Brunch menu submitted | **Choice** yes/no | `json(triggerBody())?['payload']?['brunch_menu_submitted']` |
| Brunch requests | Multiple lines | `json(triggerBody())?['payload']?['brunch_requests']` |

If SharePoint rejects the value, wrap in Expression:  
`if(empty(json(triggerBody())?['payload']?['brunch_datetime']), null, json(triggerBody())?['payload']?['brunch_datetime'])`  
or append `:00` if needed:  
`concat(json(triggerBody())?['payload']?['brunch_datetime'], ':00')` only when the value has no seconds.

(Only brunch datetime / attendance / menu / requests matter when hosting = yes; empty is fine when no.)

---

## Vendors + staff dates

| Display name | Type | Expression |
|--------------|------|------------|
| Vendors | Multiple lines | `string(json(triggerBody())?['payload']?['vendors'])` |
| Date room cutoff | Date only | `…?['date_room_cutoff']` |
| Date menu due | Date only | `…?['date_menu_due']` |
| Date vendor list | Date only | `…?['date_vendor_list']` |
| Date gift bag | Date only | `…?['date_gift_bag']` |
| Date getting ready | Date only | `…?['date_getting_ready']` |

---

## Gift bags (later — skip for now)

When you come back: Choice **Gift bags** yes/no + optional Number **Bags quantity**. Delivery fields stay staff-side later.

---

## Update item Id

Save: `first(body('GetDraftItems')?['value'])?['ID']`  
Submit: `first(body('GetSubmitItems')?['value'])?['ID']`

## loadDraft Response

Use `DraftID` + `FormPayload` (not `Draft_x0020_ID` / old `Payload`).
