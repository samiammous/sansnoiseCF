# Deploying Sans Noise to Cloudflare Pages

Static site (HTML/CSS/JS + fonts/images) plus one serverless function for the
contact form. Registrar + DNS: **Namecheap**. Hosting: **Cloudflare Pages**.

---

## Part 1 — Put the code on GitHub

The repo root must contain: the five `.html` files, `styles/`, `assets/`,
`fonts/`, `app.jsx`, `tweaks-panel.jsx`, and the `functions/` folder.
You can delete `screenshots/` and `uploads/` — they are not part of the site.

1. Create a new GitHub repository.
2. Push these files to the **root** of the repo (not inside a subfolder).
   `functions/api/contact.js` must stay at `functions/api/contact.js`.

---

## Part 2 — Create the Cloudflare Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → authorize GitHub → pick the repo.
2. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Build output directory:** `/`
3. **Save and Deploy.** You get a live URL like `sans-noise.pages.dev`.
   Cloudflare auto-detects the `functions/` folder — no extra config.

Every later push to the main branch redeploys automatically.

---

## Part 3 — Turn on the contact email (Resend, free)

1. Create a free account at **resend.com** (3,000 emails/month free).
2. Resend → **Domains** → add `sansnoise.com`. It shows a set of DNS records
   (DKIM / SPF / usually an MX on a `send` subdomain). Add those **at Namecheap**
   — see Part 5 for where. Wait for Resend to show "Verified."
3. Resend → **API Keys** → create one (Full access).
4. Cloudflare → your Pages project → **Settings → Environment variables → Add**:
   - Name: `RESEND_API_KEY`  (exact spelling)
   - Value: the key
   - Mark it **Encrypted / Secret**. Save.
5. **Redeploy** (Deployments → Retry, or push a commit) so the key loads.

---

## Part 4 — Turn on the local backup (Cloudflare KV)

1. Cloudflare → **Storage & Databases → KV → Create namespace**
   (e.g. `sansnoise-contacts`).
2. Your Pages project → **Settings → Bindings** (or **Functions → KV namespace
   bindings**) → **Add binding**:
   - Variable name: `CONTACT_KV`  (exact spelling)
   - Namespace: the one you just made. Save → **Redeploy**.
3. View submissions any time in that namespace; keys start with `submission:`.
   (If you skip this, the form still emails — it just won't keep a copy.)

---

## Part 5 — Connect sansnoise.com

Your DNS is at Namecheap. Two ways to do this. **Option A is simpler and more
reliable for the apex domain.** Both keep the domain registered at Namecheap and
both are free.

### Option A (recommended) — let Cloudflare run the DNS

You change only the *nameservers* at Namecheap. Registration stays at Namecheap.

1. Cloudflare → **Add a site** → enter `sansnoise.com` → choose the **Free** plan.
2. Cloudflare scans your current records. **Check the imported list** — if the
   domain currently receives email (e.g. MX records for Google Workspace,
   Namecheap Private Email, etc.), make sure those MX/TXT records are present so
   you don't lose mail. Add any that are missing.
3. Also add the **Resend** records from Part 3 here (in Cloudflare DNS).
4. Cloudflare gives you **two nameservers** (like `xxx.ns.cloudflare.com`).
5. Namecheap → **Domain List → Manage → Nameservers** → switch to **Custom DNS**
   → paste the two Cloudflare nameservers → save. (Propagation: minutes to a few
   hours.)
6. Once Cloudflare shows the domain "Active": your Pages project →
   **Custom domains** → **Set up a domain** → add `sansnoise.com`, then again for
   `www.sansnoise.com`. Cloudflare creates the records and SSL automatically.

### Option B — keep DNS at Namecheap

Works, but the apex (root) domain is fussier because DNS doesn't allow a plain
CNAME at the root.

1. Pages project → **Custom domains → Set up a domain** → add
   `www.sansnoise.com`. Cloudflare shows a CNAME target (`sans-noise.pages.dev`).
2. Namecheap → **Domain List → Manage → Advanced DNS → Add New Record:**
   - Type: **CNAME**, Host: `www`, Value: `sans-noise.pages.dev`, TTL: Automatic.
3. For the root domain, add `sansnoise.com` as a custom domain in Pages too, then
   in Namecheap add **either**:
   - **ALIAS Record** — Host: `@`, Value: `sans-noise.pages.dev`  *(use this if
     Namecheap offers the ALIAS type — it does on BasicDNS)*, **or**
   - **URL Redirect Record** — Host: `@`, Value: `https://www.sansnoise.com`,
     type: Permanent (301). This sends the bare domain to the www version.
4. Add the **Resend** records from Part 3 here at Namecheap (Advanced DNS →
   Add New Record), matching the type/host/value Resend shows.
5. SSL is issued by Cloudflare automatically once the records resolve (can take
   a few minutes to ~an hour).

---

## Part 6 — Test once live

- Visit `https://sansnoise.com` and `https://www.sansnoise.com` — both should
  load over HTTPS.
- Submit the contact form. You should get an email at `hello@sansnoise.com`
  (reply-to is the visitor, so you just hit reply), and a new `submission:` key
  should appear in the KV namespace.
- The Perspectives page is live at `/perspectives` but hidden from the nav. When
  you're ready to publish it, uncomment the `<a href="perspectives.html">` lines
  in each page's `<nav>` and footer, then push.

---

## Notes

- Clean URLs work automatically: `program.html` is served at both `/program.html`
  and `/program`.
- Nothing secret lives in the repo — the Resend key is only in Cloudflare's
  environment variables.
- The contact form will not send from the local file preview; the `/api/contact`
  endpoint only exists once deployed on Cloudflare.
