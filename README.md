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

All current page shells use `assets/app.js` and `assets/style.css`. `health.html` remains an alias for the women's wellbeing page.

The homepage includes working quick calculators, tracker tabs and topic filters. Health guides support search, category filtering, article views and source links. Frequently asked questions expand without a page reload.
