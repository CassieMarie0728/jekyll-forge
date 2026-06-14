# Jekyll Forge Mobile App

React Native Android app for managing Jekyll blogs on the go.

## Features

- ✅ OAuth authentication via Manus
- ✅ Three-mode post editor (visual, markdown, preview)
- ✅ Asset management with camera/gallery upload
- ✅ Publishing workflow with scheduling
- ✅ AI assistant and content repurposing
- ✅ Social media publishing (Twitter, LinkedIn, Facebook, Instagram)
- ✅ A/B testing and content optimization
- ✅ Offline support with local caching
- ✅ Real-time sync with web app

## Setup

### Prerequisites
- Node.js 18+
- pnpm
- Android SDK (for building APK)
- Expo CLI

### Installation

```bash
cd mobile/jekyll-forge-mobile
pnpm install
```

### Development

```bash
# Start Expo development server
pnpm start

# Run on Android emulator
pnpm android

# Run on connected Android device
pnpm android
```

### Environment Variables

Create `.env.local`:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_OAUTH_CLIENT_ID=your_client_id
```

## Project Structure

```
src/
  ├── screens/        # Screen components
  ├── components/     # Reusable components
  ├── navigation/     # Navigation configuration
  ├── stores/         # Zustand state management
  ├── utils/          # Utilities (tRPC, API)
  ├── hooks/          # Custom React hooks
  ├── contexts/       # React contexts
  └── services/       # API services
```

## Building for Production

### Android APK

```bash
pnpm run build:android
```

### Android App Bundle (for Google Play)

```bash
eas build --platform android
```

## Testing

```bash
pnpm test
```

## Troubleshooting

### Metro bundler issues
```bash
pnpm start --reset-cache
```

### Clear cache
```bash
rm -rf node_modules .expo
pnpm install
```

## Documentation

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [tRPC Documentation](https://trpc.io)

## License

MIT
