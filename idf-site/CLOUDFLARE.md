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

## 2. Resend — the email to the owner

Without this, submissions sit in R2 and nobody knows they arrived. Resend's free
tier is 3,000 emails a month.

1. Sign up at **resend.com**, then **API Keys → Create**, permission
   **Sending access**. Copy the key — it is shown once.
2. In **Pages → Settings → Variables and Secrets → Add**, add these three.
   The key must be **type: Secret**, not Plaintext — a plaintext value is
   readable by anyone with dashboard access afterwards.

   | Name | Type | Value |
   |---|---|---|
   | `RESEND_API_KEY` | Secret | the key from step 1 |
   | `NOTIFY_TO` | Plaintext | `interiordesignflooring@gmail.com` |
   | `NOTIFY_FROM` | Plaintext | see below |

3. `NOTIFY_FROM` is the sender address, and Resend will only send from a domain
   you have verified with it. Two stages:
   - **Before the real domain is live**, use `Estimate Form <onboarding@resend.dev>`.
     That works immediately with no DNS, but Resend only delivers it to the
     address that owns the Resend account — fine for testing, not for the
     client.
   - **At launch**, add the real domain under **Resend → Domains**, paste the
     DKIM and SPF records it gives you into Cloudflare DNS, then set this to
     something like `Estimate Form <estimates@interiordesignflooring.com>`.
     If the domain is already on Cloudflare, Resend can add the records itself.

   Deliverability to Gmail depends on this being a verified domain. Skipping it
   is how the notification quietly lands in spam.

4. Redeploy. Again: variables added after a deployment do not reach it.

The email carries every filled-in field, sets **reply-to** to the customer's
address so a reply goes straight to them, and attaches the photographs — up to
15 MB of them. Anything past that stays in R2 and the email names the folder.

---

## 3. Turnstile — spam

A public form with an email address behind it will get bot submissions. There is
already a honeypot field in the form that catches unsophisticated ones. Turnstile
is Cloudflare's CAPTCHA and is free and usually invisible.

1. **dash.cloudflare.com → Turnstile → Add widget.**
2. Hostnames: the `.pages.dev` domain, plus the real domain when it exists.
   Widget mode **Managed**.
3. It gives you two keys. They go in different places:

   | Key | Where | Type |
   |---|---|---|
   | Site key (public) | Pages → Variables → `PUBLIC_TURNSTILE_SITE_KEY` | Plaintext |
   | Secret key | Pages → Variables → `TURNSTILE_SECRET` | **Secret** |

   `PUBLIC_TURNSTILE_SITE_KEY` is read at **build** time and baked into the
   HTML, so it must be set as a build variable and the site must rebuild after
   you set it. `TURNSTILE_SECRET` is read at **request** time by the Function.
   Setting one without the other breaks the form: a site key with no secret is
   just an unchecked widget, and a secret with no site key rejects every
   submission because the browser never sends a token.

Leave both unset until the form is working end to end. Adding a CAPTCHA to a
form you are still debugging makes it much harder to tell what failed.

---

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
