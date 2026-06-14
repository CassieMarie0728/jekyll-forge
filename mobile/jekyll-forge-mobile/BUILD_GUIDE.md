# Jekyll Forge Mobile - Android Production Build Guide

## Prerequisites

1. **Node.js 18+** and **pnpm** installed
2. **Expo CLI**: `npm install -g @expo/eas-cli`
3. **Expo Account**: Sign up at https://expo.dev
4. **Google Play Console**: For app store submission

---

## Development Build

```bash
# Install dependencies
cd mobile/jekyll-forge-mobile
pnpm install

# Start development server
pnpm start

# Run on Android emulator/device
pnpm android
```

---

## Production Build Steps

### 1. Configure EAS

```bash
# Login to Expo
eas login

# Configure project (first time only)
eas build:configure
```

### 2. Set Environment Variables

Create a `.env.production` file:

```env
API_URL=https://jekyllforge.manus.space
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_REDIRECT_URI=jekyllforge://oauth/callback
```

### 3. Generate Android Keystore

EAS Build handles keystore generation automatically. For manual control:

```bash
# Generate keystore (one-time)
keytool -genkeypair -v -storetype PKCS12 -keystore jekyll-forge.keystore -alias jekyll-forge -keyalg RSA -keysize 2048 -validity 10000

# Store credentials securely
eas credentials
```

### 4. Build APK (Testing)

```bash
# Build APK for internal testing
eas build --platform android --profile preview
```

### 5. Build AAB (Production)

```bash
# Build Android App Bundle for Play Store
eas build --platform android --profile production
```

### 6. Submit to Google Play

```bash
# Submit to internal testing track
eas submit --platform android --profile production
```

---

## App Signing

### Automatic (Recommended)
EAS Build manages signing keys automatically. Your keystore is securely stored in Expo's infrastructure.

### Manual Signing
If you prefer manual control:

1. Generate keystore (see step 3)
2. Add to `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "credentialsSource": "local"
      }
    }
  }
}
```
3. Place `credentials.json` in project root:
```json
{
  "android": {
    "keystore": {
      "keystorePath": "./jekyll-forge.keystore",
      "keystorePassword": "your-password",
      "keyAlias": "jekyll-forge",
      "keyPassword": "your-key-password"
    }
  }
}
```

---

## Google Play Store Listing

### Required Assets
- **App Icon**: 512x512 PNG (no alpha)
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: Min 2, recommended 8
  - Phone: 1080x1920 or 1440x2560
- **Short Description**: Max 80 characters
- **Full Description**: Max 4000 characters

### Suggested Listing Content

**Short Description:**
> Manage your Jekyll blog from anywhere. Write, publish, and optimize content with AI.

**Full Description:**
> Jekyll Forge is the ultimate mobile companion for Jekyll blog owners. Write posts in visual or markdown mode, manage assets, publish to GitHub Pages, and leverage AI to optimize your content across social media platforms.
>
> Key Features:
> - Three-mode editor (Visual, Markdown, Preview)
> - Asset manager with camera/gallery upload
> - AI-powered content repurposing (8 formats)
> - Social media publishing (Twitter, LinkedIn, Facebook, Instagram)
> - A/B testing with variation generation
> - Offline support with auto-sync
> - Push notifications for publish events
> - Scheduled posts management
> - Content analytics dashboard

---

## Version Management

Update version in `app.json`:
```json
{
  "version": "1.0.1",
  "android": {
    "versionCode": 2
  }
}
```

- `version`: User-facing version (semver)
- `versionCode`: Must increment for each Play Store upload

---

## Over-the-Air Updates

For non-native changes (JS/assets), use EAS Update:

```bash
# Push update to production
eas update --branch production --message "Bug fixes and improvements"
```

Users receive updates automatically without re-downloading from Play Store.

---

## Troubleshooting

### Build Fails
```bash
# Clear caches
pnpm expo start --clear
rm -rf node_modules && pnpm install

# Check EAS build logs
eas build:list
```

### Signing Issues
```bash
# Reset credentials
eas credentials --platform android

# Verify keystore
keytool -list -v -keystore jekyll-forge.keystore
```

### Performance Issues
- Enable Hermes engine (default in Expo 49+)
- Use `react-native-reanimated` for animations
- Profile with React DevTools and Flipper
