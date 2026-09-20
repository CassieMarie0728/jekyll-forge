# Jekyll Forge public landing page

Static HTML/CSS, no JavaScript required. Main source: index.html and forge.css. Brand: void black, blood red, ghost white, ash; Special Elite headings and Courier New body. The illustrative Markdown comparison is explicitly labeled, not presented as an app screenshot.

Launch links open the hosted app repository picker. The field manual links to the existing setup guide on the migration branch until Mintlify is published.

## Both Pages artifact layouts

The legacy static workflow uploads the repository root; root index.html redirects to landing/. The dedicated workflow uploads landing/ directly. The nested landing/index.html compatibility redirect keeps a previously bookmarked /landing/ URL working when the dedicated artifact is active. No workflow permission or configuration changes are required for either layout to display the same design. Retiring the redundant workflow is still recommended when workflow access is available.

The Worker build also emits these assets under /welcome/. Its signed-out homepage routes there; signed-in users continue to the repository picker.

## Accessibility and responsive behavior

Native links and details/summary work without JavaScript. Skip link, visible focus, reduced-motion support, wrapped mobile navigation, no horizontal page overflow. Headline text is ghost white with blood-red underline rather than low-contrast red letters; small headings remain white. Google Fonts is optional; Courier New is the fallback.
