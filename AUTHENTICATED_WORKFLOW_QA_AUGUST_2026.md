# Authenticated Workflow QA — August 2026

## Verification Scope

This record tracks non-destructive route checks for the deployed Jekyll Forge web application. The intended scope is the landing-to-auth-to-repository-picker flow, followed by authenticated workspace, dashboard, and AI-provider settings navigation.

| Check | Observation | Result |
| --- | --- | --- |
| Deployed repository picker | Navigating to `https://jekyllforge.manus.space/repos` redirected to the Manus application authentication boundary. | **Pass:** protected route did not expose repository content while unauthenticated. |
| Authenticated repository picker | The owner signed in through their normal browser. The picker showed the connected GitHub account and accessible repositories. | **Pass:** authenticated repository data was reachable. |
| Existing workspace dashboard | The owner selected the existing Jekyll workspace. The dashboard loaded its connected GitHub status, zero-content empty state, navigation sidebar, and site context without creating content. | **Pass:** authenticated workspace navigation worked as expected. |
| AI Provider settings | The owner opened AI Settings without entering a key. The screen showed the provider setup requirement, server-side key disclosure, OpenRouter, Gemini, and Groq setup cards, applicable safeguards, and Mistral as unavailable. | **Pass:** the strict free-only provider UI rendered correctly and did not report a false provider configuration. |

## Next Acceptance Step

The normal browser successfully completed the owner sign-in path after a Cloudflare challenge prevented the remote-browser handoff. The remaining authentication gates are a first-time account sign-up test and any cross-user authorization scenario that would require a separate controlled account. No repository writes, publishing actions, provider key submissions, or account changes were used in this verification.
