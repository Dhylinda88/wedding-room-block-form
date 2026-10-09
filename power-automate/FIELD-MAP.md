# SharePoint ↔ form mapping (CSV-backed)

**Canonical rule:** the CSV headers in `Backups/100926_Schema.csv` are the source of truth. The form payload keys and Power Automate keys must sync to the list header intent, using snake_case in JSON and the same human-readable label in SharePoint when practical.

**Do not use legacy names:** `brunch_*`, `brunch_hosting`, `brunch_menu_submitted`, `brunch_datetime`, `brunch_attendance`, `brunch_requests`.

## CSV-backed schema contract

These are the live list headers we must match exactly or intentionally map to the equivalent payload name:

| CSV header | Canonical payload key | Notes |
|-----------|----------------------|-------|
| `Title` | `couple_name` | Same as the form title / couple name |
| `FormURL` | `form_url` | Resume URL for draft / submitted form |
| `DraftID` | `draft_id` | Unique draft key |
| `Status` | `status` | `draft` / `submitted` |
| `Wedding Date` | `wedding_date` | Date only |
| `Complete By` | `complete_by` | Deadline |
| `Created At` | `created_at` | Auto timestamp |
| `Updated At` | `updated_at` | Auto timestamp |
| `Submitted At` | `submitted_at` | Auto timestamp |
| `Email` | `email` | Customer email |
| `Phone` | `phone` | Customer phone |
| `Couple Name` | `couple_name` | Stored separately from title |
| `Couple Parents` | `couple_parents` | Optional parent info |
| `Guests` | `guests` | Room block count |
| `Guest Notes` | `anticipated_rooms` | Room needs / pickup notes |
| `VIP Upgrade` | `vip_upgrade` | Optional VIP upgrade flag |
| `Group Arrival` | `group_arrival` | Date only |
| `Group Departure` | `group_departure` | Date only |
| `Wedding Venue` | `wedding_venue` | Venue name |
| `Ceremony Time` | `ceremony_time` | Time |
| `Reception Venue` | `reception_venue` | Venue name |
| `Reception Time` | `reception_time` | Time |
| `Gift Bags Needed` | `bags_providing` | Gift bag flag |
| `Gift Bag Payment Method` | `bags_payment_method` | Optional value |
| `Vendor Valet Needed` | `valet_needed` | Valet flag |
| `Vendor Name` | `vendors` | Vendor list data |
| `Vendor Details` | `vendors` | Vendor note / nested vendor object |
| `Valet Payment` | `valet_payment` | `individual` / `hosted` / `master` / `other` |
| `Ready Room Needed` | `getting_ready_needed` | Resulting form flag |
| `Ready Room Guests Number` | `getting_ready_guests` | Count |
| `Ready Room Access D/T` | `ready_room_access_datetime` | Access date/time |
| `Catering Needed` | `catering_needed` | Equivalent of the old `catering_required` naming |
| `Catering Menu Choices` | `catering_menu_choices` | Menu options |
| `Catering Menu Selected` | `menu_selected` | Selected menu choice |
| `Catering Date/Time` | `catering_datetime` | Date/time |
| `Catering Attendance Numbers` | `catering_numbers` | Attendance count |
| `Catering Dietary Restriction` | `catering_dietary_restrictions` | Dietary notes |
| `Shuttle Bus Required` | `transport_required` | Shuttle flag |
| `Shuttle/Trans Details` | `transport_block` | Combined transport details |
| `In-House Contact Name` | `weekend_contact_name` | Contact name |
| `In-House Contact Phone` | `weekend_contact_phone` | Contact phone |
| `FormPayload` | `form_payload` | Raw JSON snapshot |
| `Guest Rooms Due Date` | `date_room_cutoff` | Internal date |
| `Menu Due Date` | `date_menu_due` | Internal date |
| `Vendor List Due Date` | `date_vendor_list` | Internal date |
| `Gift Bag Due Date` | `date_gift_bag` | Internal date |
| `Staff Task List` | `staff_task_list` | Staff-only list reference |

## Required alignment rule

- The CSV header name is authoritative for the actual list column.
- The payload name should match the meaning of that header in snake_case.
- If a column was renamed or legacy-brunch-labeled in earlier drafts, it must be updated to the CSV-backed version above.
- No new mapping should be added based on memory or old naming. If the header is not in the CSV, do not add it unless the list is updated first.

## Form → list working map

| List column | Type | Payload / expression |
|-------------|------|----------------------|
| `Title` | Text | `couple_name` |
| `DraftID` | Text | `variables('DraftIDFinal')` / `outputs('DraftID_Submit')` |
| `Status` | Text | `draft` / `submitted` |
| `Created At` | DateTime | `utcNow()` |
| `Updated At` | DateTime | `utcNow()` |
| `Submitted At` | DateTime | `utcNow()` on submit |
| `Couple Name` | Text | `couple_name` |
| `FormURL` | Text/Hyperlink | Resume URL expression |
| `Wedding Date` | DateOnly | `wedding_date` |
| `Complete By` | DateOnly | `complete_by` |
| `Email` | Text | `email` |
| `Phone` | Text | `phone` |
| `Guests` | Number | `guests` |
| `Guest Notes` | Note | `anticipated_rooms` |
| `Group Arrival` | DateOnly | `group_arrival` |
| `Group Departure` | DateOnly | `group_departure` |
| `Wedding Venue` | Text | `wedding_venue` |
| `Ceremony Time` | Text | `ceremony_time` |
| `Reception Venue` | Text | `reception_venue` |
| `Reception Time` | Text | `reception_time` |
| `Gift Bags Needed` | Choice yes/no | `bags_providing` |
| `Gift Bag Payment Method` | Choice | `bags_payment_method` |
| `Vendor Valet Needed` | Choice yes/no | `valet_needed` |
| `Valet Payment` | Choice | `valet_payment` |
| `Ready Room Needed` | Choice yes/no | `getting_ready_needed` |
| `Ready Room Guests Number` | Number | `getting_ready_guests` |
| `Catering Needed` | Choice yes/no | `catering_needed` |
| `Catering Menu Selected` | Choice yes/no | `menu_selected` |
| `Catering Date/Time` | DateTime | `catering_datetime` |
| `Catering Attendance Numbers` | Number | `catering_numbers` |
| `Catering Dietary Restriction` | Note | `catering_dietary_restrictions` |
| `Shuttle Bus Required` | Choice yes/no | `transport_required` |
| `Shuttle/Trans Details` | Note | `transport_block` |
| `In-House Contact Name` | Text | `weekend_contact_name` |
| `In-House Contact Phone` | Text | `weekend_contact_phone` |
| `FormPayload` | Note | `string(json(triggerBody())?['payload'])` |

### Form URL (resume link)

1. In the list, add or confirm **FormURL**.
2. On create / update, store the resume URL via the same `concat(...)` expression pattern for both save and submit paths.
3. This should always match the live list header, not any legacy variable naming.

## Composes

**ValetDetails**
```text
Other: @{json(triggerBody())?['payload']?['valet_other']}
Billing contact: @{json(triggerBody())?['payload']?['valet_billing_contact']}
Instructions: @{json(triggerBody())?['payload']?['valet_billing_instructions']}
```

**TransportBlock** — company, contact, vehicles, pickups, return, venue (same as before).

**VipAccess**
```text
VIP: @{json(triggerBody())?['payload']?['vip_names']}
Accessibility: @{json(triggerBody())?['payload']?['accessibility']}
```
