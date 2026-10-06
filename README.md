# Wedding Guest Room Block Form

Branded, password-gated form for The LaSalle Chicago wedding room-block logistics.

**Stack:** static site on **GitHub Pages** + **Power Automate** + **SharePoint List** (work Microsoft 365) + Outlook email. No server you run.

**Follow setup in order:** [SETUP-ORDERED.md](SETUP-ORDERED.md) (single source of truth). Do not use the old Excel path.

Customers get one shared link and an access code. They **Save progress** (list draft + resume email) or **Submit final** (your work email alert). Cloud autosave is off on purpose.

**Live form:** [https://dhylinda88.github.io/wedding-room-block-form/](https://dhylinda88.github.io/wedding-room-block-form/)

Staff unlock (staff password in Power Automate) edits the list without emails; staff resubmit refreshes the PDF only. Details: [power-automate/STAFF-PDF.md](power-automate/STAFF-PDF.md).

## Invite / resume links

Prefill dates for a new couple (coordinator sends this + guest access code):

```text
https://dhylinda88.github.io/wedding-room-block-form/?wedding_date=2026-06-15&complete_by=2026-05-16
```

Open an existing draft:

```text
https://dhylinda88.github.io/wedding-room-block-form/?draft=4ba53f80
```

Draft + dates together:

```text
https://dhylinda88.github.io/wedding-room-block-form/?draft=4ba53f80&wedding_date=2026-06-15&complete_by=2026-05-16
```

| Param | Example | Notes |
|-------|---------|--------|
| `wedding_date` | `2026-06-15` | Also accepts `MM/DD/YYYY` |
| `complete_by` | `2026-05-16` | If omitted with `wedding_date`, form uses wedding − 30 days |
| `draft` | `4ba53f80` | Loads that list row after unlock |

Append with `?` then `&` between params. No spaces.

## What’s included

| Path | Purpose |
|------|---------|
| [`index.html`](index.html) | Form UI (password gate, sections, thank-you) |
| [`styles.css`](styles.css) | Cream / navy / gold styling |
| [`app.js`](app.js) | Unlock, validation, manual save, resume, submit |
| [`config.js`](config.js) | `API_URL`, mock mode, intro copy |
| [`assets/logo.png`](assets/logo.png) | Logo |
| [`SETUP-ORDERED.md`](SETUP-ORDERED.md) | **Ordered** SharePoint List + flow + Pages guide |
| [`power-automate/`](power-automate/) | Short pointer to SETUP-ORDERED |
| [`.nojekyll`](.nojekyll) | Lets GitHub Pages serve files as-is |

## Preview / local

With `MOCK_MODE: true` in `config.js`, unlock with `preview` (browser-only saves).  
With `MOCK_MODE: false` and `API_URL` set, the form talks to Power Automate.

```bash
cd wedding-room-block-form
npx --yes serve .
```

## Go live (ordered)

Open **[SETUP-ORDERED.md](SETUP-ORDERED.md)** and complete Phases 0 → 5 in order. Do not skip ahead. Excel Online is not part of this build.

## Customer form sections

1. Contact (required to save): couple/party name, wedding date, email, phone + intro **complete-by** date  
2. Wedding basics  
3. Rooms & VIP  
4. Transportation / shuttles  
5. Valet parking  
6. Welcome / gift bags  
7. Vendor access (blank repeatable rows)  
8. Post-wedding brunch  
9. Important dates at a glance  

Billing / master account / concessions stay off the customer form (track in the list or a future Admin UI).

## How save / resume works

```text
Unlock with password (guest or staff)
  → Fill required identity fields
  → Click Save progress
  → Guest: SharePoint draft + OneDrive Drafts file + resume email (?draft=ID)
  → Staff: SharePoint draft only (no email / no Drafts file)
  → Reopen link + password → continue
  → Submit final
  → Guest: status=submitted + OneDrive PDF + staff email
  → Staff: status=submitted + PDF update only (no email)
```

Fallback: lock screen → **Already started? Resume with email**.

## Validation

- **Save progress (staff):** couple / party name + wedding date  
- **Save progress (guest):** also email (for the resume link)  
- **Submit final (guest):** all guest sections required (yes/no answers + details when Yes; transport company `N/A` skips shuttle fields; vendor company `N/A` if none)  
- **Submit final (staff):** couple name + wedding date (+ complete-by) 
- Dates use the browser calendar picker (`type="date"`)  
- Counts use +/- steppers  

Important dates (staff): room cutoff & menu due = complete-by (wedding − 30); vendor list = wedding − 14; gift bag = wedding − 1; getting-ready left blank.

## Maintenance

| Change | Where |
|--------|--------|
| Questions / branding | `index.html`, `styles.css`, `config.js` → push to GitHub |
| Access code / staff email | Power Automate Compose + Outlook actions |
| Track weddings | Microsoft List **Wedding Room Planner** |

## Security note

Shared password is checked in Power Automate on every call. Do not put the real password in `config.js` (`MOCK_PASSWORD` is preview-only). Treat the HTTP URL like a secret endpoint (anyone with URL + password can post).

## Future (not in this build)

- Admin UI (staff-only billing / concessions)  
- Preset checklists (menus, vendors) via `config.js`  
- Per-customer passwords / file uploads  
