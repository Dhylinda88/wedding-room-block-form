# Wedding Guest Room Block Form

Branded, password-gated form for The LaSalle Chicago wedding room-block logistics.

**Stack:** static site on **GitHub Pages** + **Power Automate** + **SharePoint List** (work Microsoft 365) + Outlook email. No server you run.

**Follow setup in order:** [SETUP-ORDERED.md](SETUP-ORDERED.md) (single source of truth). Do not use the old Excel path.

Customers get one shared link and an access code. They **Save progress** (list draft + resume email) or **Submit final** (your work email alert). Cloud autosave is off on purpose.

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
Unlock with password
  → Fill required identity fields
  → Click Save progress
  → SharePoint list upsert (status=draft) + Outlook resume email (?draft=ID)
  → Reopen link + password → continue
  → Submit final → status=submitted + your work email
```

Fallback: lock screen → **Already started? Resume with email**.

## Validation (save & submit)

- Couple / party name — required  
- Wedding date / complete-by — valid dates  
- Email — basic format  
- Phone — at least 10 digits  

Enforced in the browser before save/submit.

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
