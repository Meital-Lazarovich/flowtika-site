# Flowtika — one-page site

Static, hand-written site (no build step, no dependencies). Hebrew, RTL-first.

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire page (single file, all content) |
| `styles.css` | All styling. Design tokens are CSS variables in `:root` at the top |
| `script.js` | The hero's 100-leads scan, lead-form validation, submit, sent and error states |
| `images/` | Team photos for "מי אנחנו" |
| `logo.svg` | Standalone logo (the logo is also inlined in `index.html`) |
| `deploy/deploy.sh` | Uploads the committed site (and `images/`) to the VPS |

## Run locally

No build needed. Either open `index.html` directly, or serve it:

```bash
python3 -m http.server 8899 --bind 127.0.0.1
# then open http://127.0.0.1:8899
```

Use `127.0.0.1` rather than `localhost` if something else (e.g. Docker) occupies the port on IPv6.

## Design system

Everything derives from the CSS variables in `:root` (`styles.css`):

- **Surfaces** `--paper`, `--soft`, `--tint`, dark hero `--night`
- **Text** `--ink`, `--ink-2`, `--muted`
- **Brand** `--teal`, `--teal-deep`, `--mint` (hero), `--amber` (the bottleneck / the question)
- **Shape** `--r`, `--r-sm`, `--sh-1/2`, motion `--ease-out`, `--dur*`

Layout breakpoints are container queries on `.page` (900px and 640px). Conventions: RTL-first (use `inset-inline-*` / `margin-inline`, not left/right). Font is Assistant via Google Fonts. Short hyphens only, no em-dashes in copy.

## Page structure

Dark hero (100 leads scanned, trust line) → "מכירים את זה?" (scorecard) → "מד הדליפה" (3 questions move a gauge; the score goes with the form as `leak_score`) → "המדד מול השאלה" (green dashboard with an orange note per tile) → "השיטה" (three rounds, each revealing the next) → "בדיקת רנטגן" offer (3 steps and a sample report) → "מי אנחנו" (Omry and Meital, "למה בטוח להתחיל איתנו") → "שאלות ותשובות" (FAQ) → contact form (sent and error states) → footer.

## WhatsApp button (disabled)

The floating WhatsApp button and its chat popup (name and phone, sent to the lead endpoint with
`source=whatsapp`) are in the code but switched off until the WhatsApp line is ready.

To turn it on, change one line at the top of `script.js`:

```js
var FEATURES = { whatsapp: true };
```

and deploy. While it's `false`, the markup in `index.html` (`data-feature="whatsapp"`) stays hidden,
nothing in it can be focused, and no listeners attach. Its styles are the `WhatsApp widget` block in
`styles.css`. When it comes back, also restore its line in `privacy/index.html` (Hebrew and English).

## Deploy

The site runs on the same Hostinger VPS as the Flowtika bot (76.13.131.217, ssh alias `flowtika-vps`).
The bot's Caddy, in Docker under `/opt/flowtika`, already serves `/opt/flowtika/site` on port 80, so
there is no web server to install here. Don't install Caddy or nginx on the server separately: Docker's
Caddy holds ports 80 and 443.

To ship the committed version of the branch you're on (normally main):

```bash
bash deploy/deploy.sh
```

It's then live at http://76.13.131.217. Domains and HTTPS are set in the bot repo's Caddyfile
(`/opt/flowtika/Caddyfile` on the server): once `flowtika.com` and `www` point at the VPS (`A` records),
its `:80` block becomes `flowtika.com, www.flowtika.com { ... }` and Caddy gets the certificates itself.

## Outstanding before launch

1. **The lead form posts to the bot server** (`LEAD_URL` in `script.js`,
   `https://76-13-131-217.sslip.io/website/lead`). It answers 200 when the lead is saved, 400
   when name or phone is missing, 429 after 5 tries in 10 minutes, and 502 when it can't save;
   the form shows the matching state. Until that endpoint is live, sending shows the error
   state (with office@flowtika.com as the fallback).
2. **DNS cutover** — the domain still needs its `A` records pointed at the VPS.
