# Jekyll Forge

Jekyll Forge is a visual CMS for Jekyll blogs.

The public landing page lives in [`landing/`](./landing/) and is deployed to GitHub Pages by the `Deploy Landing Page to GitHub Pages` workflow.

If GitHub Pages is accidentally configured to deploy from the repository root instead of the workflow artifact, the root [`index.html`](./index.html) redirects visitors to the landing page.

## Landing page

Open the landing page source here:

- [`landing/index.html`](./landing/index.html)
- [`landing/styles.css`](./landing/styles.css)
- [`landing/script.js`](./landing/script.js)

## GitHub Pages

Use this repository setting:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```
