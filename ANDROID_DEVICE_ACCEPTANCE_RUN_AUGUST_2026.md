# Android Development APK Acceptance Run

This is a **non-production, owner-run acceptance check** for the Android development build. Use a disposable draft or repository and do not enter API keys, access tokens, or Play credentials into screenshots or notes.

## Install

1. On the Android phone, download and install the development APK: <https://expo.dev/artifacts/eas/t_rJAugM1I0aTKet1S4qJTjzn7zG01fTAemjIIAvurc.apk>.
2. If Android warns that the source is unknown, allow the browser or file manager used for this download to install the APK. This is expected for a development APK and does **not** make the app Play-distributed.
3. Open **Jekyll Forge** and confirm it launches under the expected package identity: `com.cassandracrossno.jekyllforge`.

## Minimal Acceptance Checklist

| Step | Action | Pass condition | What to report |
| --- | --- | --- | --- |
| 1 | Tap **Sign In** and complete the supported flow in the system browser. | The browser returns to the app through `jekyllforge://auth-callback`; no token is visible in the URL. | “Sign-in passed” or the exact visible error. |
| 2 | Force-close Jekyll Forge, then open it again. | The signed-in session restores without another login. | “Session restored” or “login repeated.” |
| 3 | In a disposable draft, change only the title or a short line of text while connected. Close and reopen the draft. | The edit remains present. Do not publish. | “Online draft persisted” or the visible issue. |
| 4 | Disable Wi-Fi and mobile data. Make one additional harmless draft-text change, then re-enable network and wait 15–30 seconds. Reopen the draft. | The change is retained locally and then synchronizes without a duplicate draft or error. | “Offline recovery passed” or the visible queue/sync message. |
| 5 | When the app requests notification permission, allow it. If no prompt appears, open Android **Settings → Apps → Jekyll Forge → Notifications** and confirm notifications are allowed. | Permission is allowed or the system-level state is visible. | “Notifications allowed,” “prompt did not appear,” or the exact issue. |

## Evidence to Send Back

Please send a short result in this format. Screenshots are useful only for an error, the restored signed-in screen, or the notification permission/state; exclude account tokens and any personal data you do not want shared.

```text
Device model:
Android version:
APK build: c3a7de26-8596-4289-a29a-611247018fc6
1. Sign-in:
2. Session restore:
3. Online draft persistence:
4. Offline recovery:
5. Notifications:
Any error text:
```

## Stop Conditions

Stop and report the exact screen or error if sign-in does not return to the app, the app crashes, the session does not restore, the offline change disappears or duplicates, or the notification state cannot be reached. Do not retry by publishing content or by entering credentials into the app beyond the normal supported sign-in flow.
