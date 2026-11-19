# Flowtika — one-page site

Static, hand-written site (no build step, no dependencies). Hebrew, RTL-first.

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire page (single file, all content) |
| `styles.css` | All styling. Design tokens are CSS variables in `:root` at the top |
| `script.js` | Reveal-on-scroll, sticky header, floating CTA, lead-form validation + submit |
| `logo.svg` | Standalone logo (the logo is also inlined in `index.html`) |
| `deploy/Caddyfile` | Web-server config for the VPS |
| `deploy/deploy.sh` | Uploads the site to the VPS over `scp` |

## Run locally

No build needed. Either open `index.html` directly, or serve it:

```bash
python3 -m http.server 8899 --bind 127.0.0.1
# then open http://127.0.0.1:8899
```

Use `127.0.0.1` rather than `localhost` if something else (e.g. Docker) occupies the port on IPv6.

## Design system

Everything derives from the CSS variables in `:root` (`styles.css`):

- **Surfaces** `--bg`, `--bg-soft`, `--bg-tint`
- **Text** `--ink`, `--ink-2`, `--muted`
- **Brand** `--navy`, `--accent` (teal `#2c7a72`), `--accent-soft`
- **Shape** `--radius`, `--shadow-sm/md`, `--maxw` (1160px), `--pad`

Conventions: RTL-first (use `inset-inline-*` / `margin-inline`, not left/right). Font is Assistant via Google Fonts. Short hyphens only — no em-dashes in copy. Breakpoints at 980px and 680px.

## Page structure

Hero → "כל חוליה נראית תקינה" (3 dept cards + big-question callout) → "אתם מודדים הרבה" → "המדד מול השאלה" (6 cards) → "השיטה" (4-step iteration flow) → "בדיקת רנטגן" offer → "מי אנחנו" (about Flowtika, 3 cards) → contact form → footer.

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
