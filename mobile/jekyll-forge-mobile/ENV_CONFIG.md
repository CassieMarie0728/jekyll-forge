# Environment Configuration

## Setup

Create a `.env.local` file in the project root with the following variables:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_OAUTH_CLIENT_ID=your_oauth_client_id
EXPO_PUBLIC_OAUTH_REDIRECT_URI=jekyllforge://auth-callback
```

## Variables

### `EXPO_PUBLIC_API_URL`
- **Description:** Backend API URL for tRPC calls
- **Default:** `http://localhost:3000`
- **Example:** `https://api.jekyllforge.com`

### `EXPO_PUBLIC_OAUTH_CLIENT_ID`
- **Description:** OAuth client ID for Manus authentication
- **Required:** Yes
- **Example:** `your_client_id_here`

### `EXPO_PUBLIC_OAUTH_REDIRECT_URI`
- **Description:** OAuth redirect URI for deep linking
- **Default:** `jekyllforge://auth-callback`
- **Note:** Must match OAuth app configuration

## Deep Linking

The app uses deep linking for OAuth callbacks. The scheme is configured in `app.json`:

```json
{
  "scheme": "jekyllforge"
}
```

This allows the OAuth provider to redirect back to the app after authentication.
