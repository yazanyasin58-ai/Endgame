# Putting the site on a link

Cloudflare Pages, connected to this repository. Free, and it rebuilds on every
push, so the client's link stays current without anyone re-sending anything.

## One-time setup

At **dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git**,
pick `yazanyasin58-ai/Endgame`, then set:

| Setting | Value |
|---|---|
| Production branch | `claude/idf-homepage-five-directions-ycul73` |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| **Root directory** | **`idf-site`** |

The root directory is the one that catches people out — the site is not at the
top of the repository, and the build fails without it.

Node version comes from `.nvmrc`. Nothing else needs configuring.

Set the production branch to the working branch, not `master`. `master` has no
site on it, so a build from there produces nothing.

## What the client gets

- A permanent URL, `<project>.pages.dev`, that updates a minute or two after
  every push.
- A separate preview URL for every branch and pull request, so a change can be
  shown before it lands on the main link.

## Before sending the link

The site is deliberately not finished, and some of what it shows is meant to be
seen as unfinished:

- Image slots render as labelled reserved space. Nine of them are waiting for
  the photographs. This is on purpose — it shows the layout at the right
  proportions without inventing imagery.
- Blocked slots appear where facts are unconfirmed: the service-area list, the
  lender name, the embedded map.
- The Real Estate page renders a notice and nothing else, and is absent from
  the menu.
- Forms do not submit and say so on the page.

Worth one line to the client so none of it reads as a bug.

Every page carries `noindex`, so the preview will not turn up in search results.
Remove that at launch — see `src/layouts/Base.astro`.

## Password protection

If the link should not be open to anyone who has it, Cloudflare Access (Zero
Trust → Access → Applications) puts an email-code login in front of the Pages
domain, free for a small number of users. Worth doing if the site carries the
licence number and showroom address before launch.

## At launch

1. Drop the photographs into `public/img/` — see the table in `README.md`.
2. Remove every `scene` prop, so no vector comp ships.
3. Remove `noindex` from `src/layouts/Base.astro`.
4. Wire the form to a real endpoint.
5. Point the real domain at the Pages project and run Lighthouse against it.
