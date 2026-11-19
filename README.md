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
| `deploy/Caddyfile` | Web-server config for the VPS |
| `deploy/deploy.sh` | Uploads the site (and `images/`) to the VPS over `scp` |

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

Dark hero (100 leads scanned, trust line) → "מכירים את זה?" (scorecard) → "המדד מול השאלה" (green dashboard with an orange note per tile) → "השיטה" (three rounds, each revealing the next) → "בדיקת רנטגן" offer (3 steps and a sample report) → "מי אנחנו" (Omry and Meital, "למה בטוח להתחיל איתנו") → "שאלות ותשובות" (FAQ) → contact form (sent and error states) → footer.

## Deploy

The site is served by [Caddy](https://caddyserver.com) on a Hostinger KVM VPS. Caddy handles HTTPS automatically (Let's Encrypt) — no certbot, no renewal cron.

One-time server setup (Ubuntu/Debian):

```bash
apt update && apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
mkdir -p /var/www/flowtika
```

Then copy `deploy/Caddyfile` to `/etc/caddy/Caddyfile` on the server and `systemctl reload caddy`.

To ship changes:

```bash
bash deploy/deploy.sh      # set VPS_IP at the top of the script first
```

DNS: `A @` and `A www` must point at the VPS IP. Caddy issues the certificate automatically once DNS resolves there.

## Outstanding before launch

1. **The lead form posts to the bot server** (`LEAD_URL` in `script.js`,
   `https://76-13-131-217.sslip.io/website/lead`). It answers 200 when the lead is saved, 400
   when name or phone is missing, 429 after 5 tries in 10 minutes, and 502 when it can't save;
   the form shows the matching state. Until that endpoint is live, sending shows the error
   state (with office@flowtika.com as the fallback).
2. **DNS cutover** — the domain still needs its `A` records pointed at the VPS.
