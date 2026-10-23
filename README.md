# Mama's Love

A responsive educational website for women's wellbeing, pregnancy, postpartum care and baby development. The site includes a journal and three browser-based tools:

- Pregnancy tracker: estimate pregnancy week, days, trimester and due date from a last-period date or estimated due date.
- Period tracker: estimate the next period from the last-period date and usual cycle length.
- Baby tracker: calculate approximate age and record a checklist of developmental milestones.

Tracker dates, preferences and milestone checkmarks are saved in the current browser's `localStorage`. No account or backend is required, and the trackers do not send these entries to a server. Clearing the site's browser data removes saved entries.

The interactive Canvas background responds to pointer movement, has a pause control and respects your device's reduced-motion setting. Your pause preference is remembered in this browser. Fonts are served locally; their licenses and source versions are recorded in `assets/fonts/`.

The tools and articles provide general education, not diagnosis or personalised medical advice. Cycle estimates must not be used as contraception, and developmental milestones are guides rather than deadlines. The support page links to established health information and services; this site does not provide messaging or emergency care.

## Run locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Deploy

This is a static site and can be deployed directly to Vercel, Netlify, Cloudflare Pages or another static host. Publish the repository root; no build command or dependency installation is required. `vercel.json` enables clean URLs on Vercel. Local navigation also uses explicit `.html` paths so it works with Python's server.

All current page shells use `assets/app.js`, `assets/style.css`, `assets/brand.css` and `assets/footer.css`. `health.html` remains an alias for the women's wellbeing page.

The homepage includes working quick calculators, tracker tabs and topic filters. Health guides support search, category filtering, article views and source links. Frequently asked questions expand without a page reload.

Display headings use self-hosted Lilita One. The background includes pointer-responsive ribbons and moving shapes; the ticker, photo and decorative badges animate too. The pause control stops background and decorative motion, and reduced-motion preferences disable these effects.

The shared header and footer embed the embracing-heart Mama’s Love vector identity directly, so logo visibility does not depend on a separate image request. Page assets include a release query to refresh cached versions when the identity changes. Reusable light/dark logo files and home-screen icons are in `assets/brand/`; usage and colours are documented there. The SVG favicon is mirrored at the site root, and each page includes the matching Apple icon and manifest. The footer provides tracker access, grouped navigation, device-storage information and a concise care note.

## Logo downloads

Download `downloads/mamas-love-logo.png` (transparent, 3340 × 860) or `downloads/mamas-love-brand-kit.zip` for both colour variants, SVG masters, icons and the source font license. The on-dark PNG uses light lettering; the regular PNG uses plum lettering.

## Blog and shared comments

`learn.html` is the blog index. Existing `learn.html#post-id` links open individual posts with cover images, reading times, related articles and a comment section. Comments ask only for a display name and comment, with no email or visitor account. Names and comments are public. Tracker dates remain local to the visitor's browser.

Shared comments require the included Node serverless function at `api/comments.js` and a Redis database. The browser does not store or simulate public comments locally. Vercel deploys the function automatically; no build command or npm packages are needed.

To enable public posting:

1. In the Vercel project, open **Storage / Marketplace**, add **Upstash Redis**, and connect a database to this project for Production (and Preview if desired).
2. Make sure the integration provides `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Existing `KV_REST_API_URL` and `KV_REST_API_TOKEN` variables also work. These must stay server-side; do not paste secrets into browser files or chat.
3. Redeploy after connecting the database. Open a blog post and submit a comment, then check from another browser to confirm shared storage.

Without that connection, the comment section explicitly reports that comments are temporarily unavailable and disables posting. A Python static server cannot run the comments API. The rest of the website still works on static hosting; shared comments require Vercel or another host that can run the Node handler.

The API validates article IDs and text lengths, rejects cross-origin requests, renders comments as text, and rate-limits submissions to five per visitor in ten minutes. It shows the newest 50 comments per post, and retains older comments in Redis. The database owner can inspect or remove stored comments through the Upstash console under `mamas:comments:v1:post:<post-id>`. When adding a new post in `assets/content.js`, add its ID to the `POSTS` set in `api/comments.js`.

Run the backend checks with `node tests/comments-api.test.cjs`. They use a mocked Redis REST transport and cover independent visitors, validation, rate limits, and storage failures; they do not claim to verify a live database connection.
