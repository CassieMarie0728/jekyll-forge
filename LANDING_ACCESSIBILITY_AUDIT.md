# Jekyll Forge — Landing Page Accessibility & Keyboard Audit

## Scope
Comprehensive review of semantic HTML structure, keyboard navigation, focus management, accessible labels (`aria-label`, `alt`), and reduced-motion compliance in `client/src/pages/Home.tsx` and `client/index.html`.

## Findings & Hardening

1. **Semantic Hierarchy**:
   - `<h1>` properly assigned to the primary value proposition ("Jekyll management, forged everywhere").
   - `<h2>` assigned to major structural sections (Workflow, Features, Integration Showcase, FAQ).
   - `<h3>` assigned to sub-cards and feature titles.

2. **Keyboard Navigation & Focus Rings**:
   - All interactive elements (CTA buttons, FAQ accordions, tab selectors) use semantic `<button>` or `<a>` elements with visible focus rings (`focus-visible:ring-2 focus-visible:ring-ring`).
   - Modal triggers and interactive carousels support keyboard activation (Enter / Space).

3. **Reduced-Motion Safeguards**:
   - Framer Motion animations respect system preferences (`prefers-reduced-motion`).
   - Programmatic scroll behavior for the hero "See Workflow" button checks `window.matchMedia('(prefers-reduced-motion: reduce)')` to fall back to instant `auto` scrolling instead of smooth animation when requested.

4. **Accessible Labels**:
   - Icon-only controls and social links include descriptive `aria-label` attributes.
   - Images and icons carry appropriate alt text or are marked decorative (`aria-hidden="true"`).
