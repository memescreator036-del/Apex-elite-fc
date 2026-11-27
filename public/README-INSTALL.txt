APEX ELITE FC — SEARCH FILES + SAFE ADMIN RECOVERY PATCH

FILES TO ADD
1. public/search.html
2. public/search.js

FILE TO EDIT
3. netlify/functions/api.mjs — add the recovery route exactly as described in:
   patches/admin-recovery-patch.txt

ADMIN LOCATION
Your netlify.toml says:
  [build]
    publish = "public"
    functions = "netlify/functions"

The repository currently has admin.html at the ROOT, outside public/.
A root admin.html is NOT included in the deployed public folder.
To make the existing full admin dashboard available at /admin.html:
- Copy the existing root admin.html into public/admin.html.
- Keep the root admin.html as a backup for now.
- Do not replace it with a different, reduced admin dashboard.
This preserves its existing 15 sections and existing API actions.

SEARCH LINK
Add this link to the existing navigation in public/index.html:
  <a href="/search.html">Search</a>
Place it beside the other navigation links. Do not replace the homepage.

DO NOT DELETE
- Do not delete netlify/functions/api.mjs.
- Do not delete public/index.html, package.json or netlify.toml.
- Do not delete the existing root admin.html until the deployed /admin.html
  has been tested.
- Do not upload the earlier search/admin ZIP; this package supersedes it.

SEARCH DATA
The search page reads GET /api/site. Your current API returns public data,
including published playerProfiles, news, products, menu, sponsors and squad.
It intentionally does not expose private registration records, payment data,
orders or admin codes.

TEST AFTER DEPLOY
- https://YOUR-SITE/search.html
- https://YOUR-SITE/admin.html
- https://YOUR-SITE/api/site
- https://YOUR-SITE/sitemap.xml
- https://YOUR-SITE/robots.txt

The search page links players to /players.html and squad entries to /squad.html.
Check those pages exist in public before launch; if not, change those result
links to the relevant existing page.
