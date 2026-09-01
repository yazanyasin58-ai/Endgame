# Cloudflare setup — the estimate form and its photo storage

`DEPLOY.md` covers getting the site onto a link. This covers the second half:
making the estimate form actually send, and giving it somewhere to put the
photographs a customer attaches.

## The shape of it

The site stays a static build. One file, `functions/api/estimate.ts`, is the
only server-side code — Cloudflare Pages picks up a `functions/` directory
automatically and turns each file into a route, so that file becomes
`POST /api/estimate` on the same domain. No separate service, no CORS, nothing
extra to deploy. It ships on the next push after these settings exist.

```
browser  ──POST multipart──▶  /api/estimate  ──▶  R2 bucket   (photos + a JSON record)
                                    │
                                    └──────────▶  Resend      (email to the owner,
                                                               photos attached)
```

Three services, and **each is independent**. The Function checks for each one
and works without it:

| Missing | What happens |
|---|---|
| R2 binding | Text-only submissions still go through. A submission **with** files is refused with a message telling the customer to text or email them, rather than accepted and dropped. |
| Resend key | Submission is stored in R2, nothing is emailed, and a warning goes to the deployment log. |
| Turnstile secret | No spam check. The honeypot field still catches the crude bots. |

So it can be switched on in three sittings rather than one. Do R2 first — that
is the part that cannot be reconstructed if a submission is lost.

---

## 0. The off switch

`OFFLINE` in `functions/_middleware.ts`. **Currently `false` — the site is
online.** When true, every request returns 503 and nothing is served: pages,
images, stylesheets and `/api/estimate` alike, with or without credentials.

Both directions are one line and a push, and both are verified against a local
Workers runtime before shipping.

It is a committed constant rather than a dashboard toggle or a missing secret on
purpose: "nobody sees this" should not be reachable by accident, and either
direction should be a reviewable change someone can find later.

503 rather than 404 when off, so crawlers hold the pages they know instead of
dropping them.

If the domain itself must stop resolving — a harder disconnect than this — that
is DNS, in the account that holds the zone: delete the two CNAME records, or
remove the custom domain from the Pages project.

---

## 0b. The access gate — who can see the site

Independent of OFFLINE above; while the site is offline this does not apply.

**Currently OFF.** The site is an open preview again at the client's request:
anyone with a link reaches it, and no password is needed. `SITE_PASSWORD` does
not need to be set while it is off.

It stays out of search regardless — `preLaunch` in `src/lib/site.ts` is still
true, so every page carries noindex and robots.txt disallows everything. Open to
anyone with the link, invisible to search.

To close it again, set `GATE_ENABLED = true` in `functions/_middleware.ts` and
set `SITE_PASSWORD` in the Pages project. Everything below describes how it
behaves when on.

---

`functions/_middleware.ts` runs ahead of every request —
pages, images, stylesheets and `/api/estimate` alike — and returns 401 until a
password is supplied. Verified against a local Workers runtime: an unauthorised
request gets 401 on the homepage, on a CSS bundle, on a logo image, on
`/real-estate/` and on the API endpoint; a correct one gets 200 and the real page.

**Set this before anyone can get in:**

Pages project → **Settings** → **Variables and Secrets** → add, for **both**
Production and Preview:

| Name | Value |
|---|---|
| `SITE_PASSWORD` | a long random string — it is shared, so make it unguessable |
| `SITE_USER` | optional, defaults to `idf` |

Then redeploy. The browser shows a standard password prompt; username `idf`
unless you set `SITE_USER`.

### Why it is built this way

Two switches of different kinds, on purpose:

- `GATE_ENABLED`, a constant **in the file, committed to the repo**
- `SITE_PASSWORD`, a secret **in the dashboard, never in the repo**

If the secret alone controlled it, losing that variable — a settings change, a
new environment, a typo — would silently publish the entire site, and nothing in
the repository would show that anything had changed. Instead a missing password
with the gate on returns **503**, closed, naming what to set. A gate whose
failure mode is "open" is not a gate.

**At launch:** set `GATE_ENABLED = false` in a commit. Going public should be a
reviewable line of code, not a dashboard toggle nobody can find afterwards.

### What it is not

A shared password proves someone knows the password, not who they are. Everyone
you give it to is indistinguishable in any log, and you cannot revoke one person
without changing it for everybody.

If you want real per-person access, **Cloudflare Access** (Zero Trust) does it
properly and is free for small teams: Zero Trust dashboard → Access →
Applications → Self-hosted, pointed at the Pages hostnames, with a policy
allowing specific email addresses. People get a one-time PIN by email, you can
see and revoke each one individually, and Pages has a built-in shortcut for the
preview URLs under Settings → General → *Preview deployment access*.

**Do not run both.** Two gates means two login prompts. If you set up Access,
set `GATE_ENABLED = false` and let Access do the work.

## 1. R2 — where the photographs go

R2 is Cloudflare's file storage. Free tier is 10 GB and no egress charge, which
this form will not come close to.

1. **dash.cloudflare.com → R2 → Create bucket.**
2. Name it `idf-estimates`. Location: **Automatic**. Leave it **private** —
   nothing here should be publicly readable; customer photographs of the inside
   of their house are not public files.
3. Go to **Workers & Pages → your Pages project → Settings → Bindings →
   Add → R2 bucket.**
4. Set it exactly like this:

   | Field | Value |
   |---|---|
   | Variable name | `ESTIMATE_UPLOADS` |
   | R2 bucket | `idf-estimates` |

   The variable name is what the code looks for. A different name here and the
   Function behaves as though there is no bucket at all — refusing uploads,
   with no error in the dashboard to explain why.
5. Add it for **Production**, then again for **Preview** if you want the
   preview links to work too. Bindings are per-environment; adding it to one
   does not add it to the other.

**Bindings do not apply to deployments that already exist.** After adding one,
go to **Deployments → the latest one → ⋯ → Retry deployment**, or just push a
commit. This is the single most common reason a correctly-configured form still
does not work.

### Retrieving what comes in

Everything lands under a key built from the date and a reference number:

```
estimates/2026-08/IDF-20260828-K3P9Q/01-kitchen.jpg
estimates/2026-08/IDF-20260828-K3P9Q/02-plans.pdf
estimates/2026-08/IDF-20260828-K3P9Q/submission.json
```

`submission.json` holds every form field, the timestamp, and the list of files.
Browse and download from **R2 → idf-estimates → Objects**. The reference is also
shown to the customer on screen and put in the email subject line, so a phone
call about "my request from Tuesday" can be matched to a folder.

Once the email in step 2 is working, the inbox is the day-to-day route and R2 is
the backup — the copy that survives a deleted email.

---

## 2. The info@ mailbox, and the email to the owner

Estimates go to **info@interiordesignconstructiondmv.com**. That address is
published on every page of the site and is the default recipient baked into
`functions/api/estimate.ts`. Two separate things have to be true for it to
work, and they are easy to confuse:

- **Receiving** at info@ needs a mailbox. That is step 2a.
- **Sending** the notification needs Resend, and Resend will only send from a
  domain it has verified. That is step 2b.

Until info@ is confirmed to be arriving and read, the endpoint emails **both**
info@ and the owner's long-standing `interiordesignflooring@gmail.com`, so no
submission can be lost in the changeover. Dropping the Gmail is one variable
edit — see the end of 2b.

### 2a. Create info@ — Cloudflare Email Routing

The domain is already on Cloudflare, so the free route is Cloudflare's own
Email Routing. It is a **forwarder**, not a mailbox: mail to info@ is delivered
to an inbox that already exists. That is all the estimate notification needs.

1. Cloudflare dashboard → the `interiordesignconstructiondmv.com` zone →
   **Email → Email Routing → Get started**.
2. Let it **add the MX and SPF records for you**. It writes three MX records
   and one SPF TXT record on the apex. Do not hand-write these.
3. **Destination addresses → Add** the inbox that should actually receive —
   the owner's Gmail. Cloudflare emails a confirmation link there; it is not
   live until someone clicks it.
4. **Routing rules → Create address**: `info@` → that verified destination.
5. Send a test from any outside account to info@ and watch it land.

Two limits to know before promising the client anything:

- Email Routing **forwards only**. Nobody can *reply* as info@ from it. Replies
  will come from whatever inbox received the forward. For the estimate form
  that is fine — the notification sets reply-to to the customer, so hitting
  reply reaches the customer either way — but if the client wants to *send*
  as info@, that needs a real mailbox: Google Workspace (~$7/user/month, and
  it replaces the apex MX records, so Email Routing comes off first) or
  Microsoft 365. Ask before assuming.
- Forwarded mail keeps the original sender. Some senders that fail SPF/DMARC at
  the destination get dropped in forwarding. Gmail destinations are reliable.

### 2b. Resend — sending the notification

Without this, submissions sit in R2 and nobody is told they arrived. Resend's
free tier is 3,000 emails a month.

1. Sign up at **resend.com**, then **API Keys → Create**, permission
   **Sending access**. Copy the key — it is shown once.
2. **Domains → Add domain.** Use the subdomain **`send.interiordesignconstructiondmv.com`**,
   not the apex. This matters: Resend adds an MX record for the domain you give
   it, and the apex MX records belong to Email Routing from 2a. Verifying a
   subdomain keeps the two from colliding. If the domain is on the same
   Cloudflare account Resend can write the records itself; otherwise paste the
   DKIM, SPF and DMARC records it shows into Cloudflare DNS and press Verify.
3. In **Pages → Settings → Variables and Secrets → Add**, add these three.
   The key must be **type: Secret**, not Plaintext — a plaintext value is
   readable by anyone with dashboard access afterwards.

   | Name | Type | Value |
   |---|---|---|
   | `RESEND_API_KEY` | Secret | the key from step 1 |
   | `NOTIFY_TO` | Plaintext | `info@interiordesignconstructiondmv.com,interiordesignflooring@gmail.com` |
   | `NOTIFY_FROM` | Plaintext | `Interior Design Flooring <estimates@send.interiordesignconstructiondmv.com>` |

   `NOTIFY_TO` is a comma-separated list; every address on it gets the same
   email. Once the client confirms info@ is arriving and being read, reduce it
   to `info@interiordesignconstructiondmv.com` alone. Leaving both on costs
   nothing but duplicates.

   `NOTIFY_FROM` must be on the domain verified in step 2, or Resend rejects
   the send outright. Before verification is done, `Estimate Form
   <onboarding@resend.dev>` works with no DNS at all — but Resend only delivers
   that to the address that owns the Resend account, so it is for testing and
   never for the client.

4. **Redeploy.** Variables added after a deployment do not reach it — Pages
   bakes them into the deployment at build time. Push a commit, or use
   **Deployments → Retry deployment**, then submit the form once and confirm
   the email arrives at info@.

Deliverability to Gmail depends on the domain in `NOTIFY_FROM` being verified.
Skipping step 2 is how the notification quietly lands in spam.

The email carries every filled-in field, sets **reply-to** to the customer's
address so a reply goes straight to them, and attaches the photographs — up to
15 MB of them. Anything past that stays in R2 and the email names the folder.

---

## 3. Turnstile — spam

A public form with an email address behind it will get bot submissions. There is
already a honeypot field in the form that catches unsophisticated ones. Turnstile
is Cloudflare's CAPTCHA and is free and usually invisible.

### Why there are two keys, and why they behave differently

Turnstile is a challenge issued in the browser and verified on the server, so it
needs a key at each end:

- The **site key** is rendered into the page's HTML so the widget knows which
  configuration to load. It is public by design — anyone can read it in view
  source, and that is fine, because on its own it proves nothing.
- The **secret key** is used by the Function to call Cloudflare's siteverify API
  and ask "is this token real, unspent, and issued for my site?". This is the
  half that actually enforces anything, and it must never reach the browser.

The two are read at **different times**, and that difference is the whole reason
they have to be configured as a pair:

| | Read when | Ends up in | To change it |
|---|---|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | `npm run build`, on Cloudflare's build machine | the static HTML of every page with a form | needs a **rebuild** |
| `TURNSTILE_SECRET` | each request, inside the Function | nothing — stays server-side | needs a **new deployment** |

Both are satisfied by creating a new deployment, so in practice: set them, then
redeploy. But it explains why a site key you saved is not live until a build has
run, and why you cannot "just refresh" to pick one up.

### Both or neither

The Function enforces Turnstile only when it can see `TURNSTILE_SECRET`. The form
renders the widget only when it was built with `PUBLIC_TURNSTILE_SITE_KEY`. That
gives four states, and only two of them are ones you want:

| Site key | Secret | Result |
|---|---|---|
| set | set | **Correct.** Widget issues a token, Function verifies it. |
| unset | unset | **Correct.** No spam check; honeypot still active. Form works. |
| set | unset | Widget renders and does nothing. Cosmetic security — worse than none, because it looks protected. |
| unset | set | **Every submission is rejected.** The browser never sends a token, so the Function refuses all of them, including real customers. |

That last row is the one to avoid. If the form starts refusing everything with
"we could not verify that request came from a browser", this is why: the secret
is set and the site key is not reaching the build.

### The name must be exactly `PUBLIC_TURNSTILE_SITE_KEY`

Astro only exposes environment variables through `import.meta.env` when they
carry the `PUBLIC_` prefix. A variable named `TURNSTILE_SITE_KEY` is invisible to
the build, so the widget silently does not render — no error, no warning, just a
form with no token that the Function then rejects. Verified by building three
times:

```
PUBLIC_TURNSTILE_SITE_KEY=... npm run build   → data-sitekey="..." in the HTML
TURNSTILE_SITE_KEY=...        npm run build   → no widget at all
(neither set)                 npm run build   → no widget at all
```

Dropping the prefix puts you straight into the "every submission rejected" row
above, and the two settings will look correct in the dashboard while it happens.

### Setting it up

1. **dash.cloudflare.com → Turnstile → Add widget.**
2. Hostnames: add the `.pages.dev` domain **and** the real domain when it exists.
   A hostname not on this list fails verification — the same class of mistake as
   binding R2 to Production and then testing a preview URL.
3. Widget mode **Managed**.
4. Put the two keys in **Pages → Settings → Variables and secrets**:

   | Name | Type | Value |
   |---|---|---|
   | `PUBLIC_TURNSTILE_SITE_KEY` | Plaintext | site key |
   | `TURNSTILE_SECRET` | **Secret** | secret key |

5. Redeploy, then submit the form once to confirm it still goes through.

### You will probably not see anything

The widget renders with `data-appearance="interaction-only"`, so a legitimate
visitor sees no checkbox and no badge — it only becomes visible if Cloudflare
decides the visitor is suspicious. This is deliberate; an intake form should not
make a homeowner prove they are human. But it means "I do not see a CAPTCHA" is
not evidence that it failed.

Two ways to confirm it is actually on:

- **Real-time logs** show `turnstile=set` on each request.
- **View source** on `/estimate/` and search for `cf-turnstile`. If the div is
  there with a `data-sitekey`, the build picked the key up.

### Backing it out

If it goes wrong, delete **both** variables and redeploy. That returns you to the
"unset / unset" row — no spam check, but a working form. Never delete only the
site key.

## 4. Testing it

Submit the real form on the deployed URL — not a local build, since none of the
bindings exist locally unless you use Wrangler (below).

- **Success** looks like a message under the button with a reference number,
  and the button disappearing.
- **Logs** are at **Pages → your project → the deployment → Functions →
  Real-time logs**. Open it in one tab, submit in another. Every failure path in
  the Function logs the reason.

Things worth trying deliberately: submit with no files; submit with three photos;
attach something over 10 MB and confirm it is refused with a readable message
rather than a browser error.

The limits are at the top of `functions/api/estimate.ts` — 8 files, 10 MB each,
40 MB total, images and PDFs only — and are enforced server-side, so a hand-made
request cannot exceed them either.

### Running it locally

`npm run dev` serves the site but **not** the Function; the form will 405. To run
both:

```
npx wrangler pages dev dist --r2 ESTIMATE_UPLOADS
```

after `npm run build`. That gives a local R2 that writes to disk. Add
`--binding RESEND_API_KEY=...` only if you want to send real email from your
machine.

---

## 5. Cost

Everything above is inside the free tiers, and the paid steps up are far beyond
what a contractor's intake form generates:

| | Free allowance | This form |
|---|---|---|
| Pages builds | 500/month | one per push |
| Functions requests | 100,000/day | one per submission |
| R2 storage | 10 GB, no egress fee | ~20 MB per submission with photos |
| Resend | 3,000 emails/month | one per submission |

The realistic ceiling is R2 storage, at roughly 500 photo-heavy submissions
before the first 10 GB is used.

---

## Site photography — a different thing entirely

Worth separating, because "uploading photos" means two unrelated things on this
project:

- **Customer photos**, above — arrive through the form, go to R2, nobody commits
  them.
- **The site's own project photography** — the nine reserved image slots. Those
  are *files in the repository*, not storage. They go in `public/img/`, get
  committed, and Cloudflare rebuilds. There is no upload UI and there should not
  be one.

For those, see the tables in `README.md` under **Imagery** for the exact base
names, and note the standing constraint recorded there: the Yelp photographs
cannot be used, because a photograph posted by a customer belongs to that
customer. Replacement imagery comes from the company's own footage.

The quickest route with no terminal: open `idf-site/public/img/` on github.com →
**Add file → Upload files** → drag them in → commit. Name them to match the
table, any of `.webp .avif .png .jpg .jpeg`. A slot with no matching file falls
back to its vector comp, so a missing file can never ship as a broken image.

---

## Before this goes to the client

The form now sends. The rest of the launch checklist in `DEPLOY.md` still
stands, and two items on it interact with this page:

- **Password-protect the preview** (Zero Trust → Access) if the link is being
  shown around before launch. A live, unprotected form on a `.pages.dev` URL
  will find its way into scrapers.
- `NOTIFY_FROM` must move to the verified real domain before the client relies
  on the email, per step 2.

Nothing here touches the two feature gates in `src/content/idf.ts`. The financing
application stays off permanently and remains an outbound link to the lender:
income and identity data belongs on the lender's own portal, and this endpoint is
not built for it.
