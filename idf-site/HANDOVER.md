# Handing the site over to the client

Everything the client needs to own the site outright: no account of ours in the
path, no password only we know, and nothing that stops working if we walk away.

Read this once end to end before starting. Two steps below are ordered for a
reason — secrets are rotated last, and DNS is cut over only after the new
project is proved.

---

## What is being handed over

| Thing | Where it lives now | Must end up |
|---|---|---|
| Site source | `idf-site/` inside the `Endgame` repo | A repo the client's GitHub account owns |
| Hosting | Cloudflare Pages project `idf-site` | The client's Cloudflare account |
| Photo storage | Cloudflare R2 bucket `idf-estimates` | Same account as above |
| Estimate submissions already received | That bucket | Client's hands, and off ours |
| Notification email | Resend account + API key | A Resend account the client owns |
| Spam protection | Turnstile widget `idf-site` | Same Cloudflare account |
| Domain | Registrar, wherever it was bought | Client's registrar login |
| Original photographs | `idf-site/source-images/` | Travels with the repo |

Two things are *not* ours to hand over and should be confirmed as already the
client's: the Google Business Profile and the Instagram account. The site's
hours and address are kept in step with the Google profile deliberately — if
they do not control that profile, say so plainly, because the site's local SEO
depends on it.

---

## Step 1 — Give the site its own repository

**This is the step that cannot be skipped**, and it is first because everything
else points at it.

The site currently lives in `yazanyasin58-ai/Endgame`, in a subfolder, alongside
`Endgame1-…` — an unrelated trading application with broker credentials and
biometric integrations in it. That repository cannot be transferred to the
client: it would hand them someone else's private project. Nor should the client
be added as a collaborator on it for the same reason.

The site also lives only on a working branch. `master` has no site on it.

So: a new repository, containing the site alone, with the site's files at the
root rather than nested.

1. The **client** creates a GitHub account if they have none, and a new empty
   repository — `interior-design-flooring/website`, private.
2. Publish the current site into it, with `idf-site/` promoted to the root and
   its history preserved:

   ```
   git clone --single-branch \
     --branch claude/idf-homepage-five-directions-ycul73 \
     https://github.com/yazanyasin58-ai/Endgame.git idf-transfer
   cd idf-transfer
   git filter-repo --subdirectory-filter idf-site        # or git subtree split
   git branch -m main
   git remote add origin https://github.com/<client>/website.git
   git push -u origin main
   ```

   `git filter-repo` is a separate install (`pip install git-filter-repo`). If
   you would rather not, `git subtree split -P idf-site -b main` does the same
   job with the tools already present, more slowly.

3. Check the result before going further: `main` should have `package.json`,
   `src/` and `functions/` at its top level, and no `Endgame1-…` anywhere in it.

The client is then the owner. Add whoever maintains the site as a collaborator,
not the other way round.

---

## Step 2 — Move hosting to the client's Cloudflare account

Cloudflare has no "transfer this Pages project" button. The project is rebuilt
in their account against the new repo, which takes about ten minutes.

1. The **client** signs up at dash.cloudflare.com with **their own** email —
   ideally a shared company address, not a personal one, so it survives staff
   changes.
2. **Workers & Pages → Create → Pages → Connect to Git**, authorise their
   GitHub, pick the new repository. Settings:

   | Setting | Value |
   |---|---|
   | Production branch | `main` |
   | Framework preset | Astro |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | *(leave empty)* |

   Root directory is empty this time — that is the point of step 1. The old
   project needed `idf-site` because the site was nested.

3. Let it build once and open the `.pages.dev` URL it gives you. The site should
   render fully. The form will not work yet; that is the next two steps.

Do not delete the old project until the very end.

---

## Step 3 — Rebuild the form's backend in their account

Work through `CLOUDFLARE.md` in the repo, in their account this time. It has the
detail; this is the shape of it:

1. **R2 bucket** — create `idf-estimates`, keep it private, bind it to the Pages
   project as `ESTIMATE_UPLOADS`, on **both** Production and Preview.
2. **Resend** — the client creates their own account and API key. Add
   `RESEND_API_KEY` as a **Secret**, plus `NOTIFY_TO` and `NOTIFY_FROM`.
3. **Turnstile** — a new widget in their account, hostnames set to their
   `.pages.dev` domain and the real domain. `PUBLIC_TURNSTILE_SITE_KEY` as
   plaintext, `TURNSTILE_SECRET` as a Secret.
4. **Redeploy**, then submit the form once with a photo attached and confirm the
   object lands in their R2 and the email arrives in their inbox.

Bindings and variables do not reach deployments that already exist. Redeploy
after each one.

---

## Step 4 — Hand over the submissions already received

Anything customers have already sent is **their data and their customers'
data**, and it must not be left sitting in an account they cannot reach.

1. In the old R2 bucket, list what is there: each submission is a folder under
   `estimates/YYYY-MM/IDF-…` containing the photographs and a `submission.json`.
2. Download the lot. For more than a handful, `rclone` or the S3-compatible API
   beats clicking; for a handful, the dashboard is fine.
3. Upload them into the client's new bucket under the same key structure, so the
   reference numbers customers were given still resolve.
4. Once the client confirms they have them, **delete the objects from the old
   bucket**. Do not keep a copy. These are names, phone numbers, addresses and
   photographs of the inside of people's houses — there is no reason for that to
   persist in a developer's account after handover, and every reason for it not
   to.

If no real submissions have come in yet, say so and skip the copy — but still
empty the bucket of test data before decommissioning it.

---

## Step 5 — Point the domain at the new project

Only once step 3 is proved on the new `.pages.dev` URL.

1. Confirm who holds the registrar login. If the domain was bought on the
   client's behalf, move it into an account they control before going further —
   a site whose domain someone else owns is not handed over.
2. In the **new** Pages project: **Custom domains → Set up a domain**, enter the
   domain, follow the DNS instructions.
3. Set `PUBLIC_SITE_URL` in the new project to the full `https://` origin. It
   feeds canonical URLs and the sitemap; without it both are wrong.
4. Add the domain to **Resend → Domains**, paste the DKIM and SPF records into
   DNS, wait for it to verify, then change `NOTIFY_FROM` to an address on it —
   `estimates@theirdomain.com`. Redeploy.
5. Add the real domain to the Turnstile widget's hostname list.

DNS takes minutes to hours. The old project keeps serving until the record
moves, so there is no gap.

---

## Step 6 — Go live

One commit, in the new repo, containing all three:

```ts
// src/lib/site.ts
export const preLaunch = false;        // was true

// functions/_middleware.ts
const GATE_ENABLED = false;            // was true
```

`preLaunch` drops `noindex` from every page and turns `robots.txt` from
"disallow everything" into a real one with a sitemap. `GATE_ENABLED` removes the
password gate. They belong together: a public site behind a password, or an
indexed site nobody can open, are each worse than either state alone.

Push, wait for the build, then check `https://theirdomain.com/robots.txt` reads
`Allow: /` and names the sitemap.

---

## Step 7 — Revoke everything of ours

Last, deliberately, and none of it before the client confirms the new site works
on the real domain.

- **Rotate the Resend API key.** Ours has been in a dashboard we can see. The
  client creates a fresh key in their account and deletes the old one.
- **Rotate the Turnstile secret** if the old widget is being reused rather than
  replaced. Replacing it is cleaner.
- **Delete the old Cloudflare Pages project**, the old R2 bucket (emptied in
  step 4) and the old Turnstile widget.
- **Leave the client's GitHub repo** with the client as owner and admin. Remove
  our access, or keep it only if there is an agreement to maintain the site.
- **Delete the old branch** `claude/idf-homepage-five-directions-ycul73` from
  `yazanyasin58-ai/Endgame`, and the `idf-site/` folder from that repo, so there
  is one canonical copy rather than two that can drift.

---

## What the client can do without a developer

Worth walking them through in the handover call — these are the things they will
actually want next week:

- **Add or replace photographs.** Open `public/img/` on github.com, use *Add
  file → Upload files*, drag the pictures in, commit. Cloudflare rebuilds in a
  minute or two. Names must match the table in `README.md`; a slot with no
  matching file shows a labelled placeholder rather than a broken image.
- **Change wording, hours, phone numbers.** Everything factual lives in
  `src/content/idf.ts`. Edit it on github.com and commit. No page carries its own
  copy of a fact, so one edit changes it everywhere.
- **Read estimate requests.** They arrive by email with the photographs
  attached. R2 is the backup copy if an email is ever lost.
- **See what changed and undo it.** Every edit is a commit; GitHub shows the
  history and can revert one.

What they should *not* do alone: the launch flags in step 6, anything under
`functions/`, and the licence fields discussed below.

---

## Running costs

Everything is inside free tiers at this volume, but the client should know what
they now own, and that billing is on their card if it ever grows:

| | Free allowance | Realistic use |
|---|---|---|
| Cloudflare Pages builds | 500/month | one per edit |
| Pages Functions requests | 100,000/day | one per submission |
| R2 storage | 10 GB, no egress fee | ~20 MB per submission with photos |
| Resend | 3,000 emails/month | one per submission |
| Domain | — | registrar's annual fee |

The first ceiling they would ever meet is R2, at roughly 500 photo-heavy
submissions.

---

## Hand over in writing, not just in code

Give the client this list of open items with the site. Each is a decision only
they can make, and each is recorded in the repo with its reasoning:

- **Maryland and DC contractor licences.** The site advertises the DMV and
  carries only the Virginia Class A number. Maryland licenses through the MHIC,
  DC separately. Either confirm both exist, or the service area comes back to
  Virginia only. This is live on every page today.
- **The real estate page is unpublished**, at `'preview'`. Its brokerage
  disclosure is in place — Samson Companies LLC, 0226021529 — but the page
  describes an "in-house realtor" and "one team, same company", and Samson is a
  separate company. That copy needs rewriting to match the real relationship
  before it can go live. See the note on `realEstateLicence` in
  `src/content/idf.ts`.
- **The 10% credit** for using that realtor needs the same answer, and an
  attorney's view, before it is advertised.
- **Budget bands** on the estimate form are provisional.
- **Promotion terms** — the first-project offer states no cap, eligible work or
  expiry, because none were set.
- **The insurance restoration section** must never claim to negotiate, settle or
  handle a claim, never offer to absorb a deductible, and never promise what an
  insurer will pay. The reasons are in a comment above `insuranceRestoration`.

---

## Sign-off checklist

Not done until every line is ticked, by the client, on their own machine.

- [ ] Client owns the GitHub repository and can see the code
- [ ] Client owns the Cloudflare account and can see the Pages project
- [ ] Site loads on the real domain over HTTPS
- [ ] Estimate form submits, with a photo, from the client's own phone
- [ ] The email arrives in the client's inbox, photo attached
- [ ] The photo is visible in the client's R2 bucket
- [ ] Previous submissions transferred, and deleted from the old account
- [ ] `robots.txt` reads `Allow: /` and names the sitemap
- [ ] Password gate is off
- [ ] Old Pages project, bucket and Turnstile widget deleted
- [ ] Resend API key rotated
- [ ] Client can name the two people who can change the site
