# Editor Dependency Deferral — August 2026

## Finding

Mermaid and Cytoscape are transitive dependencies of `streamdown`. The editor's AI assistant used `streamdown` for generated markdown, which meant the dependency chain was included whenever the editor route loaded even if the author never opened the assistant.

## Change

The editor now lazy-loads `AIAssistant` only after the author opens the explicit **AI** control. The sheet supplies a concise loading state and an accessible title and description. This preserves the established authoring workflow while deferring the Markdown/diagram dependency path until it is requested.

## Validation

The editor regression suite verifies that the assistant is absent before the control is opened and appears after activation. The full web suite, TypeScript check, and lint pass after the change. The lint baseline remains zero errors with 219 legacy warnings.

## Boundary

This is a source-level loading improvement. The sandbox-only production-build termination during chunk rendering remains separately documented and cannot be treated as a failed application build or a verified bundle-size measurement.
