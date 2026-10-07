# denis-site

A personal site that tells the story better than LinkedIn or a CV: the person, a timeline
in the context of its time, the work, what I am into, and how to get together. Readable by
humans and by their agents.

## Edit

Everything lives in `content/profile.json`. Change it, then:

```bash
node build.mjs          # -> dist/index.html, dist/profile.json, dist/llms.txt
open dist/index.html
```

Items with `"todo": true` get a dashed "draft" outline on the page so you can see what still
needs your words. Delete the flag when a section is done. The build prints how many remain.

## Publish

`dist/` is plain static files. Drop it on Netlify, GitHub Pages, Cloudflare Pages, or behind
the studio's Caddy. Keep `/profile.json` and `/llms.txt` at the root so agents can find them.

## Let an interviewer write it for you

The part people cannot do alone is writing "how I give feedback" cold. The interviewer can:

```bash
npm install
export ANTHROPIC_API_KEY=...        # or `ant auth login`
node interview.mjs --cv "~/Downloads/My CV.pdf"
```

It reads the CV, asks one question at a time for the story behind it, then writes
`content/profile.json` validated against `schema.mjs`. Commands while talking: `/draft` writes
what it has so far, `/done` finishes, `/skip` moves on. `--resume` continues a saved interview
from `content/interview-transcript.json`. Anything it could not learn is marked `todo`.
