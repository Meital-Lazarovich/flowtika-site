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

Dark hero (100 leads scanned) → "כל המחלקות ירוקות. התוצאה לא." (scorecard) → "המדד מול השאלה" (green dashboard with an orange note per tile) → "השיטה" (three rounds, each revealing the next) → "בדיקת רנטגן" offer (sample report) → "מי אנחנו" (Omry and Meital, six commitments) → contact form (sent and error states) → footer.

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

1. **The lead form does not send email yet.** `index.html` still has the placeholder
   `access_key="YOUR_WEB3FORMS_ACCESS_KEY"`. Until a real key from
   [web3forms.com](https://web3forms.com) (verified against the destination inbox) is
   pasted in, the form shows its thank-you state but **silently discards the lead**.
2. **DNS cutover** — the domain still needs its `A` records pointed at the VPS.
