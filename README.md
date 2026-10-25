# Mama's Love

A responsive educational website for women's wellbeing, pregnancy, postpartum care and baby development. The site includes a journal and three browser-based tools:

- Pregnancy tracker: estimate pregnancy week, days, trimester and due date from a last-period date or estimated due date.
- Period tracker: estimate the next period from the last-period date and usual cycle length.
- Baby tracker: calculate approximate age and record a checklist of developmental milestones.

Tracker dates, preferences and milestone checkmarks are saved in the current browser's `localStorage`. No account or backend is required, and the trackers do not send these entries to a server. Clearing the site's browser data removes saved entries.

The interactive Canvas background responds to pointer movement and respects your device's reduced-motion setting. Fonts are served locally; their licenses and source versions are recorded in `assets/fonts/`.

The tools and articles provide general education, not diagnosis or personalised medical advice. Cycle estimates must not be used as contraception, and developmental milestones are guides rather than deadlines. The support page links to established health information and services; this site does not provide messaging or emergency care.

## Run locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

To run the admin area, shared blog and comments locally, put the Redis credentials in an untracked `.env` file and run `node scripts/dev-server.cjs`. Open http://127.0.0.1:8081/admin.html. A plain Python static server cannot run the API functions.

## Deploy

Vercel serves the static pages and the Node functions in `api/`. Publish the repository root; no build command or dependency installation is required. `vercel.json` enables clean URLs and protects the admin page and server source paths. Local navigation also uses explicit `.html` paths. Other static hosts can serve the information and trackers, but need compatible Node hosting for the admin, shared posts, pictures and comments.

All current page shells use `assets/app.js`, `assets/style.css`, `assets/brand.css`, `assets/footer.css`, `assets/blog.css` and the final shared `assets/refinements.css` layer. `health.html` remains an alias for the women's wellbeing page.

The homepage includes working quick calculators, tracker tabs and topic filters. Health guides support search, category filtering, article views and source links. Frequently asked questions expand without a page reload.

Display headings use self-hosted Lilita One. The background includes pointer-responsive ribbons and moving shapes; the ticker, photo and decorative badges animate too. Background animation follows the device’s reduced-motion preference and pauses in hidden tabs. There is no floating background pause button.

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

The API verifies that each article is published, validates text lengths, rejects cross-origin requests, renders comments as text, and rate-limits submissions to five per visitor in ten minutes. It shows the newest 50 comments per post and retains older comments in Redis. Newly published admin posts accept comments automatically. The database owner can inspect or remove stored comments through the Upstash console under `mamas:comments:v1:post:<post-id>`.

Run the backend checks with `node tests/comments-api.test.cjs`. They use a mocked Redis REST transport and cover independent visitors, validation, rate limits, and storage failures; they do not claim to verify a live database connection.

## Admin publishing

Open `/admin.html` (or `/admin` on Vercel), or follow the small Admin link in the footer. Sign in with username `admin` and the password supplied during setup. The password is stored as a salted scrypt hash in the server module, never in the page or browser JavaScript. Optional server-only `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` environment variables override the supplied account. A hash uses `scrypt:<48-character hex salt>:<128-character hex key>` with N=32768, r=8, p=1, key length 64. Changing the hash invalidates existing sessions.

The editor manages all ten existing articles and new posts. Add a title, summary, category, author and text; use blank lines for paragraphs and `## ` for section headings. Upload a cover and up to eight extra pictures, add accessible descriptions and optional source links, and preview the post. Drafts are private. Choose Published and save to put the post on the blog and homepage without a redeploy. Existing article addresses are preserved. Saving a published post as Draft removes it from the public collection and closes comments. Revision checks prevent overwriting a newer edit from another window.

The same connected Upstash database used for comments stores posts, photos and sessions. It must provide `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, or the existing `KV_REST_API_URL` / `KV_REST_API_TOKEN` aliases. If you just connected it, redeploy so Vercel functions receive the variables. The admin reports missing or unavailable storage; it never pretends browser-only edits are published. The original articles remain available on static hosting and during a public API outage.

Pictures are resized in the admin browser to a maximum of 1600 pixels and encoded as JPEG before upload. The server accepts only JPG, PNG and WebP signatures, with a 600 KB limit per picture. Photos are stored in Redis and served through `/api/media` with immutable URLs, content-type checks and long-lived cache headers. This keeps setup to one database and suits a small blog; substantial photo libraries should move to dedicated object storage. Uploaded photos remain stored if removed from a post, so existing image links continue working. Draft photos have unguessable URLs; those URLs are public if shared. Back up the Redis database to preserve posts and uploads.

Authentication uses random server-side sessions, expiring after 12 hours, with HttpOnly, SameSite=Strict cookies (Secure on HTTPS). Sign-out revokes the stored session. Login is rate-limited; changes require a same-origin JSON request. Text is escaped on the public site. Source links reject executable URL schemes. Private server directories are excluded from web routing; no database credentials appear in public assets.

The existing article baseline is also bundled in `data/posts.json`; edits and new posts are stored separately in `mamas:cms:posts:v1`. Pictures use `mamas:cms:media:<id>` and short-lived sessions use `mamas:cms:session:<hash>`. Keep the baseline in sync if changing original static articles in code. Never edit the stored post JSON by hand unless restoring a backup.

Run `node tests/cms-api.test.cjs` for authentication, access control, draft visibility, uploads, revisions, publication, comments and storage-failure checks. `node tests/admin-browser.test.cjs` uses Playwright and Chromium (override `CHROMIUM_PATH` if needed) for the complete editor workflow, independent-reader checks, mobile layouts and safe text rendering. These tests use a local Redis REST test double; production uses connected Upstash. No test storage or test account is enabled in deployed code.

## Pregnancy first, then development after birth

`growth.html` is the primary growth page: pregnancy from dating week 1 through birth, with 42 weekly information cards. Every card includes a graphic of a representative womb stage. Weeks 1–2 show the womb before conception, week 3 shows early cell division, and subsequent stages show implantation, embryo and fetal development. The drawings are schematic stage illustrations, not exact weekly measurements, scans, or representations of an individual pregnancy. `pregnancy-growth.html` remains an alias for the same prenatal guide.

`baby-growth.html` preserves all 52 first-year development cards and the existing milestone, physical-growth and care information. The development navigation presents pregnancy first and development after birth second. The pregnancy page links to the womb guide; the baby page links to the after-birth guide.

The two illustration sheets in `assets/illustrations/` are displayed as individual stage panels using CSS; they are downloaded once and reused across the weekly cards. Descriptive alternatives and captions identify illustrative stages. Weekly information and NHS source links remain in `assets/growth-content.js`.

All twelve page shells use the same SVG, PNG and ICO favicon set, Apple icon and manifest, with versioned asset URLs.

## Compact footer and background lullaby

All pages use the compact shared footer in `assets/site-footer.js` and `assets/footer.css`. It contains one navigation group, a short care/privacy note and inline social links. The previous tracker callout and separate social banner are removed. Header logos have a slow rose halo in `assets/site-effects.css`, which respects reduced-motion preferences.

`assets/lullaby.js` requests audible autoplay on every fresh page load, randomly selecting one of three curated soft-piano lullabies and excluding the previous selection. Playback uses 45% volume; only the selected compressed MP3 is fetched. Every new page starts its selected track from the beginning, even if the previous page was paused. The header control pauses or resumes music for the current page. Browsers may block unprompted sound: when that happens, playback begins on the first trusted tap or keyboard interaction. Hidden pages pause. Sound-library previews pause the background lullaby; restarting the lullaby stops a library preview so they do not overlap. Browser autoplay restrictions cannot be bypassed by the website.

## Navigation, name cards and audio library

All public pages use `assets/navigation.js` and `assets/navigation.css`, including the names, sounds and test-reader tools. Desktop menus group pregnancy, baby care and women's health; mobile menus list the same pages with keyboard and Escape support. The admin area keeps its own focused navigation. `assets/site-review.css` aligns page widths, card actions and section spacing, places hero images before their text on mobile, and keeps the social dock outside the reading area. Mobile audio categories use a select control; name and blog categories remain visible without scrolling sideways.

`assets/name-card.js` renders downloadable 1800 × 1350 PNG cards with large Lilita One lettering, a detailed floral border, gilded frames, the Mama’s Love logo, a prominent pronunciation strip, and larger meaning text. Orchid garden, Rose bouquet, and Sage blossoms styles use the custom transparent bouquet artwork in `assets/illustrations/name-card-bouquet.png`. Every catalogue name includes an automatic pronunciation guide on its listing, preview and downloaded card. Visitors choose a colour and download; no pronunciation entry is required. The preview and download share the same renderer, with Latin Extended fonts for accented names. The catalogue now uses a hand-selected collection with a meaning or a clear origin note on every entry. Short forms and spelling variants are labelled; meanings are common interpretations, not a claim of one universal etymology.

`assets/name-pronunciation-data.js` contains approximate reading guides for all 888 catalogue entries. `assets/name-pronunciations.js` looks them up locally without a service or runtime dependency. They combine existing curated respellings, CMU dictionary pronunciations, spelling predictions, and transliteration rules. They are approximate rather than verified native pronunciations; the studio explains accent variation, and Yorùbá syllable guides do not represent tones. Previously saved visitor pronunciation edits are no longer used. Regenerate the static table with `python3 scripts/generate-name-pronunciations.py` after installing build-only dependencies `cmudict==1.1.3`, `g2p-en==2.1.0` and NumPy. Curated overrides live in `data/name-pronunciation-overrides.json`. The generator loads only the installed predictor class, so unused NLTK corpora are not downloaded. CMU attribution and redistribution terms are in `assets/name-pronunciation-LICENSE.txt`.

The sound library uses a master gain of 0.45 for previews and WAV downloads, matching the 45% background-player setting. Each preview gets a fresh audio context so restarting or choosing another track schedules its notes correctly. Offline WAV rendering keeps its nodes separate from a playing preview. Downloading a track therefore does not stop the preview or leave orphaned audio playing.

On mobile and narrow tablets (up to 820px), the homepage hero shows the full photo in its natural proportions. The tracker panel sits in normal document flow beneath it with a 24px gap. Photo badges and floating decorations are hidden at this size so they cannot cover the picture. The desktop hero retains its existing layout.


## Visible sections, music downloads and expanded Yorùbá names

`assets/discovery.css` gives every public header a visible row of shortcuts to music downloads, names, pregnancy growth, trackers and the blog. The homepage also has eight section cards and a dedicated music area. `assets/site-effects.css` animates the header logo with a brighter rose-and-gold halo, a gentle light pulse and small glints. The logo stays in place; reduced-motion preferences disable its animations.

`assets/music-library.js` adds the same three piano MP3 players and direct download links to the homepage and `sounds.html#lullabyDownloads`. Players begin at 45% volume, load track metadata without starting playback, and pause background audio, other MP3 players and generated sound previews when another source starts. The sound library retains its generated WAV downloads and duration choices.

The name catalogue contains 538 Yorùbá names, 16 Oríkì, 161 familiar English-language names, 63 Hebrew names and 110 Islamic names. It replaces the previous bulk import of obscure and undocumented entries. The source is `data/curated-names.txt`; regenerate `assets/names-data.js` with `python3 scripts/build-name-catalogue.py`, then run the pronunciation generator. All names show by default, with Yorùbá first; category counts, a visible results count and batches of 60 make the complete collection accessible. Search ignores accents, and every card includes an automatic approximate reading guide.


## Educational video download

`videos.html` is the public video library, linked from shared desktop/mobile navigation, shortcuts, the footer and the homepage. `video.html` preserves the previous preview URL and points its canonical URL to the library. `assets/videos-data.js` stores the published lesson and three readable steps; `assets/videos.js` renders the homepage feature, library player, steps, downloads and save/share instructions. `assets/videos.css` styles the section. Playing a lesson pauses background music and MP3 players; choosing music pauses the video.

The 39-second safer-newborn-sleep lesson is stored in `downloads/videos/` as a 720 × 1280 H.264 Constrained Baseline MP4 with AAC audio and a front-loaded MP4 index. The poster, downloadable caption and ZIP all match the current video. Public source credits were removed from the frames, closing text, caption and video pages at the owner's request. The lesson's factual basis remains the NHS safer-sleep guidance used during production; its advice has not changed. The local development server serves MP4 files as `video/mp4` and supports byte ranges for seeking; Vercel serves the same files as static assets.


## HTTPS resource policy

`vercel.json` sends `Content-Security-Policy: upgrade-insecure-requests` so browsers request page resources over HTTPS. The existing strict policies for the admin page and uploaded media are retained and include this directive. This policy does not install or replace certificates: Vercel manages domain certificates separately. A browser screenshot confirmed a valid certificate, but the live browser warning could not be independently diagnosed from this environment.

## AI video studio

Run `node scripts/dev-server.cjs` and open `/video-studio/`. The studio supports AI storyboards with 3–6 scenes, editable image prompts, realistic image generation, still/push-in/pull-out camera movements, captions, narration, local IndexedDB projects, JSON backups and browser video export. Templates and uploaded images work without AI credentials. Creating an AI storyboard saves the current project and creates a new one.

Configure `GEMINI_API_KEY` server-side for Google Gemini. Defaults are `gemini-2.5-flash` for storyboards and `gemini-2.5-flash-image` for images; optional server variables `GEMINI_TEXT_MODEL` and `GEMINI_IMAGE_MODEL` select compatible models. The provider account must have model access and quota. AI requests require the existing Redis-backed admin login at `/admin.html` and are limited to 30 requests per admin username per hour. Keep keys out of browser code. In cloud environment settings, allow `generativelanguage.googleapis.com` and your actual Upstash hostname. Configure the existing Upstash URL/token bindings securely to enable admin login.

Each scene image is generated individually and stored in the local project; regeneration replaces that scene's image. Image prompts guide recurring-character consistency but do not guarantee it. Camera motion animates still images: this implementation does not call Veo or synthesize native motion video. Export uses the browser's supported MediaRecorder format (usually WebM); audio must be added separately. JSON backups retain image prompts and camera settings but exclude audio. AI output and health claims need review before publication.

Validation: `node tests/studio-api.test.cjs` uses a mock AI provider; `node tests/studio-browser.test.cjs` uses Playwright and Chromium to exercise the scene workflow, persistence and a real browser video download with fixture imagery. Neither test claims live provider generation.


### Narration and captions

Edit the **Narration for this scene** script (up to 220 characters), choose one of five Gemini voices, and select **Generate full voiceover**. Generation uses the same server-side Gemini key and admin login as images; the account also needs access to `gemini-2.5-flash-preview-tts` (override with `GEMINI_TTS_MODEL`). Each clip is placed at its scene's start, with silence padding to the next scene. Scene lengths expand as needed, up to 20 seconds; shorten scripts if a voice clip exceeds that limit. Generate projects with up to 20 scenes at a time; provider calls count toward the existing 30-request hourly limit. The combined WAV is saved locally with the project and included in playback and video export. Uploading or recording your own voiceover remains supported. Changing scene timing, order, scripts or voice makes an AI voiceover stale; regenerate or remove it before exporting. JSON backups exclude audio, so regenerate after importing.

Choose **Timed phrases**, **Full scene caption**, or **Hidden** for each scene. Captions are drawn directly into the exported video. Download the matching SRT file for use elsewhere. Phrase timing is evenly distributed across the scene; it is not speech transcription or word alignment. Narration scripts and caption text can be edited independently.

Run `node tests/studio-media.test.cjs` for caption timing, SRT offsets, PCM placement and stale-narration checks. The studio browser test also verifies caption pixels, generated narration persistence using a fixture, stale-audio protection, and actual exported video and audio streams with `ffprobe`. Live voice quality and provider access require configured credentials and are not established by these fixture tests.

### Standalone studio deployment and Veo scenes

The standalone URL is `https://mamas-love-video-studio.vercel.app/`. Deploy the **repository root**, not `video-studio/` by itself: the studio depends on root-level `api/`, `lib/`, `data/`, `assets/`, and admin authentication. The normal `vercel.json` routes the standalone production hostname's `/` to the studio. For a dedicated project using the CLI from the repository root, `vercel --local-config vercel.studio.json --prod` uses a studio-first configuration for all its aliases. Select no framework preset; no build command or output directory is required. A project configured with `video-studio` as its Root Directory must be updated in Vercel before this works; a Git push cannot change that dashboard setting. Configure GEMINI_API_KEY and the Redis integration **in that Vercel project**, then redeploy. Cloud environment settings do not configure Vercel production secrets.

The recurring-character description is included in image, storyboard, and Veo prompts. **Generate Veo character video** starts an actual asynchronous Gemini Veo request, using the scene image as an optional starting-frame reference. Choose portrait or landscape; clips are eight seconds. Default model: `veo-3.1-generate-preview`, optionally overridden by server variable `GEMINI_VIDEO_MODEL`. The billed provider account must have access to that model. Prompts and starting frames guide character appearance; consistency is not guaranteed. Jobs are saved in Redis for two days; use **Check pending video** until the job completes. Completed clips are fetched through an authenticated server endpoint and retained in local project storage for preview and individual MP4 download. Veo clips are not included in JSON backups, and the canvas exporter does not assemble them; it explicitly asks you to download the clips instead of silently exporting still images. Narration and captions currently apply to image-storyboard exports, not downloaded native Veo clips.

The connection status distinguishes a missing API deployment, missing Gemini key, missing Redis configuration, and required admin sign-in. `node tests/studio-video.test.cjs` checks job creation, ownership, pending/completed results and provider URL validation using a mock. The browser test exercises the Veo controls and saved clip playback with fixture video. Neither establishes live Veo access, generation quality, production deployment, or character fidelity.
