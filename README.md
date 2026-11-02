# Haardhik Kunder Portfolio

A static, newspaper-inspired single-page portfolio for Netlify. The site is plain HTML, CSS, and JavaScript, with JSON and Markdown content loaded from local files.

## Run Locally

Serve the repository root so JSON and Markdown fetches work normally:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

Opening `index.html` directly also works for Home, Projects, and Contact through the embedded fallback data in `js/app.js`. Blog post bodies are loaded from Markdown files, so the reading view needs a local server or static host.

## Netlify

The creature experiment is also plain static JavaScript. Keep the build command
blank and publish directory `.`. No Vercel, server, Functions, Node runtime, or
external CDN is required. The animation loads after the portfolio paints; a
failure in the artwork does not block the site. Creature bounds are precomputed
in `assets/vendor/alvalta/envelopes.js`, not measured during visitor startup.
Supported browsers run the drawing in a module Worker with OffscreenCanvas so
it does not compete with page scrolling. Other browsers use a lighter main-thread
fallback. Mobile uses fewer equation samples, a lower canvas pixel ratio, and
slower motion. The worker and engine are ordinary same-origin JavaScript files;
they do not require Netlify Functions or special deployment headers.

Frame-timing regression checks can optionally be run locally with
`node --test tests/*.test.mjs`. They use only Node's built-in test
runner; this is not a Netlify build step or runtime dependency.

Use these settings when connecting this repository to Netlify:

- Build command: leave blank
- Publish directory: `.`
- Base directory: repository root

The root `netlify.toml` already sets the publish directory and response headers. No Node.js version, package manager, or build step is required.

## Sections

- `#home` - first-person intro, education, stack, and archive photos.
- `#blog` - writing index from `data/articles.json`.
- `#blog/{id}` - Markdown post body from `data/posts/{id}.md`, with tables and KaTeX math.
- `#projects` - projects, research, publications, and experience.
- `#contact` - email, GitHub, LinkedIn, and resume PDF.

## Content Editing

Runtime content lives in `data/`:

| File | Holds |
| --- | --- |
| `profile.json` | Name, meta line, tagline, intro paragraphs, hobbies, socials |
| `education.json` | Schools |
| `projects.json` | Engineering and build work |
| `research.json` | Research projects |
| `publications.json` | Published papers |
| `experience.json` | Work experience |
| `skills.json` | Stack groups |
| `articles.json` | Blog index metadata |
| `posts/{id}.md` | Blog post bodies |

`js/app.js` carries an embedded JSON copy in `FALLBACK_DATA` for direct `file://` viewing. If a JSON file changes, mirror that change there when you want the offline view to stay in sync. Markdown post bodies are not embedded.

## Adding A Blog Post

1. Add an entry to `data/articles.json`:

```json
{
  "id": "short-url-safe-id",
  "title": "Post title",
  "dek": "One line teaser.",
  "date": "Jul 2026",
  "readTime": "5 min",
  "tags": ["ML", "Notes"],
  "kind": "Research note",
  "note": "An early note, still taking shape.",
  "domain": ["Topic one", "Topic two", "Topic three"]
}
```

2. Add the body at `data/posts/short-url-safe-id.md`.

Markdown is rendered with the vendored `marked` build, and math is rendered with vendored KaTeX assets under `assets/vendor/`. Nothing loads from a CDN.
