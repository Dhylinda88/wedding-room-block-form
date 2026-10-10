# Wedding Group Resume — template + Generate Resume

## Files

- Word template (content controls): `power-automate/templates/Wedding-Group-Resume-TEMPLATE.docx`
- Same file also saved at: `Forms&Templates/Template/Wedding-Group-Resume-TEMPLATE.docx`
- Original hand-typed sample (reference only): `Forms&Templates/Resume Sample.docx`

Upload the **TEMPLATE** file to OneDrive/SharePoint (e.g. `Wedding Forms/Templates/`). Do not overwrite with the filled sample.

## SharePoint list columns to add

| Display name | Suggested internal | Type | Payload key |
|--------------|-------------------|------|-------------|
| Quote Number | `QuoteNumber` | Text | `quote_number` |
| Master Account | `MasterAccount` | Text | `master_account` |
| Market Code | `MarketCode` | Text | `market_code` |

Do **not** put these into `DraftID`. DraftID stays the form resume key.

## Form (staff-only)

Under **Important dates**, staff enter Quote # / Master Account # / Market Code, then **Generate resume**.

That calls Power Automate with:

```json
{ "action": "generateResume", "password": "...", "draft_id": "...", "payload": { ... }, "staff": true }
```

## Power Automate branch (`generateResume`)

1. Condition: `triggerBody()?['action']` equals `generateResume`
2. Require `staff` true (or staff password)
3. Update SharePoint item with `quote_number`, `master_account`, `market_code` + rest of payload (same as save)
4. **Populate a Microsoft Word template**
   - File: `Wedding-Group-Resume-TEMPLATE.docx`
   - Map content controls (tags below) from `payload` / list columns
5. **Create file** in OneDrive/SharePoint, e.g.  
   `{couple_name} - {draft_id} - Resume.docx`
6. Respond: `{ "ok": true, "draft_id": "...", "resume_file": "..." }`

## Content control tags → form/list

| Word tag | Source |
|----------|--------|
| `QuoteNumber` | `payload.quote_number` |
| `MasterAccount` | `payload.master_account` |
| `MarketCode` | `payload.market_code` |
| `DraftID` | draft id variable |
| `Organization` | `payload.couple_name` |
| `CoupleName` | `payload.couple_name` |
| `GroupArrival` | `payload.group_arrival` |
| `GroupDeparture` | `payload.group_departure` |
| `WeddingDate` | `payload.wedding_date` |
| `WeddingVenue` | `payload.wedding_venue` |
| `CeremonyTime` | `payload.ceremony_time` |
| `ReceptionVenue` | `payload.reception_venue` |
| `ReceptionTime` | `payload.reception_time` |
| `Email` | `payload.email` |
| `Phone` | `payload.phone` |
| `WeekendContact` | `payload.weekend_contact_name` |
| `WeekendPhone` | `payload.weekend_contact_phone` |
| `CoupleParents` | `payload.couple_parents` |
| `Guests` | `payload.guests` |
| `GuestNotes` | `payload.guest_notes` |
| `VIPUpgrade` | `payload.vip_names` |
| `ReadyRoom` | `payload.getting_ready_needed` |
| `ReadyRoomGuests` | `payload.getting_ready_guests` |
| `Vendors` | `string(payload.vendors)` |
| `ValetNeeded` | `payload.valet_needed` |
| `ValetPayment` | `payload.valet_payment` |
| `ValetDetails` | ValetDetails compose |
| `Shuttlebus` | `payload.transport_required` |
| `TransportBlock` | TransportBlock compose |
| `GiftBags` | `payload.giftbags_provided` |
| `GiftBagNotes` | compose qty/date/time/deliverer/distribution |
| `CateringNeeded` | `payload.catering_needed` |
| `CateringMenuChoices` | `payload.catering_menu_choices` |
| `CateringDateTime` | `payload.catering_datetime` |
| `CateringAttendanceNumber` | `payload.catering_numbers` |
| `CateringDietaryRestriction` | `payload.catering_dietary_restrictions` |
| `TotalRoomsDue` | `payload.date_room_cutoff` |
| `MenuDue` | `payload.date_menu_due` |
| `VendorListDue` | `payload.date_vendor_list` |
| `GiftBagDue` | `payload.date_gift_bag` |

## Still manual / CI

Room-block night grid, negotiated rates, pick-up counts, sales/event manager names stay in CI or typed into the Word file after generate.