# Form-styled PDF HTML (SubmitHTML / DraftHTML)

Replace the junk summary + raw JSON `<pre>` in **SubmitHTML** and **DraftHTML** with the template below.

## How to paste into Power Automate

1. Open Compose **SubmitHTML** (and later **DraftHTML**).
2. Delete everything in **Inputs**.
3. Paste the HTML from the code block under **Template**.
4. For **DraftHTML**, change every `outputs('DraftID_Submit')` to `variables('DraftIDFinal')`.
5. Save → run a submit → open the new `.html` / PDF.

If a pink `fx` chip does not appear after paste, click each `@{...}` region, delete it, and re-add via **fx** using the expression *inside* the braces only.

**Remove** any `<pre>` / `string(payload)` dump — that is what made the PDF garbage.

---

## Template

Use for **SubmitHTML**. Draft ID line uses Submit; swap for Draft as noted above.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; padding: 32px 40px; font-family: "Segoe UI", Arial, sans-serif; font-size: 14px; line-height: 1.45; color: #0a1e3c; background: #f9f7f2; }
  .wrap { max-width: 760px; margin: 0 auto; }
  .brand { text-align: center; margin-bottom: 28px; }
  .brand img { height: 56px; margin: 0 auto 12px; }
  h1 { font-family: Georgia, "Times New Roman", serif; font-size: 26px; font-weight: 400; margin: 0 0 8px; color: #0a1e3c; }
  .intro { font-size: 15px; margin: 0 0 8px; }
  .ref { font-size: 12px; color: #1a3358; opacity: 0.75; margin-top: 6px; }
  h2 { font-family: Georgia, "Times New Roman", serif; font-size: 18px; font-weight: 400; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #d4b483; color: #0a1e3c; }
  .grid { display: table; width: 100%; border-collapse: separate; border-spacing: 12px 10px; margin: 0 -12px; }
  .row { display: table-row; }
  .field { display: table-cell; width: 50%; vertical-align: top; }
  .field.full { display: block; width: auto; margin: 10px 0; }
  label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #0a1e3c; }
  .box { background: #fff; border: 1px solid #c9c0b0; border-radius: 2px; padding: 8px 10px; min-height: 18px; white-space: pre-wrap; word-break: break-word; }
  .section { margin-bottom: 8px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="brand">
    <img src="https://dhylinda88.github.io/wedding-room-block-form/assets/logo.png" alt="The LaSalle Chicago" />
    <h1>Wedding Guest Room Block Details</h1>
    <p class="intro">Please complete by <strong>@{json(triggerBody())?['payload']?['complete_by']}</strong>. We’ll use this for your room block and weekend logistics.</p>
    <p class="ref">Reference: @{outputs('DraftID_Submit')} · Status: submitted</p>
  </div>

  <div class="section">
    <h2>Your contact details</h2>
    <div class="grid">
      <div class="row">
        <div class="field"><label>Couple / party name</label><div class="box">@{json(triggerBody())?['payload']?['couple_name']}</div></div>
        <div class="field"><label>Wedding date</label><div class="box">@{json(triggerBody())?['payload']?['wedding_date']}</div></div>
      </div>
      <div class="row">
        <div class="field"><label>Your email</label><div class="box">@{json(triggerBody())?['payload']?['email']}</div></div>
        <div class="field"><label>Your phone</label><div class="box">@{json(triggerBody())?['payload']?['phone']}</div></div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Wedding basics</h2>
    <div class="grid">
      <div class="row">
        <div class="field"><label>Wedding / ceremony venue</label><div class="box">@{json(triggerBody())?['payload']?['wedding_venue']}</div></div>
        <div class="field"><label>Ceremony time</label><div class="box">@{json(triggerBody())?['payload']?['ceremony_time']}</div></div>
      </div>
      <div class="row">
        <div class="field"><label>Reception venue</label><div class="box">@{json(triggerBody())?['payload']?['reception_venue']}</div></div>
        <div class="field"><label>Reception time</label><div class="box">@{json(triggerBody())?['payload']?['reception_time']}</div></div>
      </div>
      <div class="row">
        <div class="field"><label>Group arrival date</label><div class="box">@{json(triggerBody())?['payload']?['group_arrival']}</div></div>
        <div class="field"><label>Group departure date</label><div class="box">@{json(triggerBody())?['payload']?['group_departure']}</div></div>
      </div>
      <div class="row">
        <div class="field"><label>Primary wedding-weekend contact</label><div class="box">@{json(triggerBody())?['payload']?['weekend_contact_name']}</div></div>
        <div class="field"><label>Weekend contact phone</label><div class="box">@{json(triggerBody())?['payload']?['weekend_contact_phone']}</div></div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Rooms &amp; VIP</h2>
    <div class="grid">
      <div class="row">
        <div class="field"><label>Guest rooms (room block count)</label><div class="box">@{json(triggerBody())?['payload']?['guests']}</div></div>
        <div class="field"><label>Getting-ready room needed?</label><div class="box">@{json(triggerBody())?['payload']?['getting_ready_needed']}</div></div>
      </div>
    </div>
    <div class="field full"><label>Guest notes</label><div class="box">@{json(triggerBody())?['payload']?['anticipated_rooms']}</div></div>
    <div class="field full"><label>Accommodations for the wedding couple</label><div class="box">@{json(triggerBody())?['payload']?['couple_accommodations']}</div></div>
    <div class="field full"><label>Ready room guests (estimated)</label><div class="box">@{json(triggerBody())?['payload']?['getting_ready_guests']}</div></div>
    <div class="field full"><label>VIP / family names</label><div class="box">@{json(triggerBody())?['payload']?['vip_names']}</div></div>
    <div class="field full"><label>Accessibility / special requests</label><div class="box">@{json(triggerBody())?['payload']?['accessibility']}</div></div>
  </div>

  <div class="section">
    <h2>Transportation / shuttles</h2>
    <div class="grid">
      <div class="row">
        <div class="field"><label>Transportation company</label><div class="box">@{json(triggerBody())?['payload']?['transport_company']}</div></div>
        <div class="field"><label>Company contact / cell</label><div class="box">@{json(triggerBody())?['payload']?['transport_contact']}</div></div>
      </div>
      <div class="row">
        <div class="field"><label>Number / type of vehicles</label><div class="box">@{json(triggerBody())?['payload']?['transport_vehicles']}</div></div>
        <div class="field"><label>First hotel pickup</label><div class="box">@{json(triggerBody())?['payload']?['transport_first_pickup']}</div></div>
      </div>
      <div class="row">
        <div class="field"><label>Additional pickup time</label><div class="box">@{json(triggerBody())?['payload']?['transport_additional']}</div></div>
        <div class="field"><label>Expected return time</label><div class="box">@{json(triggerBody())?['payload']?['transport_return']}</div></div>
      </div>
    </div>
    <div class="field full"><label>Wedding venue (for shuttle)</label><div class="box">@{json(triggerBody())?['payload']?['transport_venue']}</div></div>
  </div>

  <div class="section">
    <h2>Valet parking</h2>
    <div class="grid">
      <div class="row">
        <div class="field"><label>Valet needed?</label><div class="box">@{json(triggerBody())?['payload']?['valet_needed']}</div></div>
        <div class="field"><label>Parking arrangement</label><div class="box">@{json(triggerBody())?['payload']?['valet_payment']}</div></div>
      </div>
      <div class="row">
        <div class="field"><label>If other, describe</label><div class="box">@{json(triggerBody())?['payload']?['valet_other']}</div></div>
        <div class="field"><label>Estimated vehicles</label><div class="box">@{json(triggerBody())?['payload']?['valet_vehicles']}</div></div>
      </div>
      <div class="row">
        <div class="field"><label>Billing contact</label><div class="box">@{json(triggerBody())?['payload']?['valet_billing_contact']}</div></div>
        <div class="field"><label>Billing instructions</label><div class="box">@{json(triggerBody())?['payload']?['valet_billing_instructions']}</div></div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Welcome / gift bags</h2>
    <div class="grid">
      <div class="row">
        <div class="field"><label>Providing gift bags?</label><div class="box">@{json(triggerBody())?['payload']?['bags_providing']}</div></div>
        <div class="field"><label>Estimated quantity</label><div class="box">@{json(triggerBody())?['payload']?['bags_quantity']}</div></div>
      </div>
      <div class="row">
        <div class="field"><label>Delivery date</label><div class="box">@{json(triggerBody())?['payload']?['bags_delivery_date']}</div></div>
        <div class="field"><label>Delivery time</label><div class="box">@{json(triggerBody())?['payload']?['bags_delivery_time']}</div></div>
      </div>
    </div>
    <div class="field full"><label>Person / vendor delivering</label><div class="box">@{json(triggerBody())?['payload']?['bags_deliverer']}</div></div>
    <div class="field full"><label>Distribution instructions</label><div class="box">@{json(triggerBody())?['payload']?['bags_distribution']}</div></div>
  </div>

  <div class="section">
    <h2>Vendor access</h2>
    <div class="field full"><label>Vendors (company / service / access)</label><div class="box">@{string(json(triggerBody())?['payload']?['vendors'])}</div></div>
  </div>

  <div class="section">
    <h2>Post-wedding brunch</h2>
    <div class="grid">
      <div class="row">
        <div class="field"><label>Hosting brunch?</label><div class="box">@{json(triggerBody())?['payload']?['brunch_hosting']}</div></div>
        <div class="field"><label>Event date / time</label><div class="box">@{json(triggerBody())?['payload']?['brunch_datetime']}</div></div>
      </div>
      <div class="row">
        <div class="field"><label>Estimated attendance</label><div class="box">@{json(triggerBody())?['payload']?['brunch_attendance']}</div></div>
        <div class="field"><label>Menu selection submitted?</label><div class="box">@{json(triggerBody())?['payload']?['brunch_menu_submitted']}</div></div>
      </div>
    </div>
    <div class="field full"><label>Special requests</label><div class="box">@{json(triggerBody())?['payload']?['brunch_requests']}</div></div>
  </div>

  <div class="section">
    <h2>Important dates</h2>
    <div class="grid">
      <div class="row">
        <div class="field"><label>Guest room cutoff</label><div class="box">@{json(triggerBody())?['payload']?['date_room_cutoff']}</div></div>
        <div class="field"><label>Menu selections due</label><div class="box">@{json(triggerBody())?['payload']?['date_menu_due']}</div></div>
      </div>
      <div class="row">
        <div class="field"><label>Final vendor list due</label><div class="box">@{json(triggerBody())?['payload']?['date_vendor_list']}</div></div>
        <div class="field"><label>Gift bag delivery</label><div class="box">@{json(triggerBody())?['payload']?['date_gift_bag']}</div></div>
      </div>
      <div class="row">
        <div class="field"><label>Getting-ready room access</label><div class="box">@{json(triggerBody())?['payload']?['date_getting_ready']}</div></div>
        <div class="field"><label>Complete by</label><div class="box">@{json(triggerBody())?['payload']?['complete_by']}</div></div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
```
