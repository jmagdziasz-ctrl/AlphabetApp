# ABC Tracing Adventure

A children's alphabet learning app built with React Native + Expo (TypeScript). Kids trace letters of the alphabet while enjoying personalized cartoon scenes featuring their own family members.

## Features

- **26 letter tracing screens** — dot-following tracing for every uppercase letter A–Z
- **Cartoon scenes** — each letter has a fun sentence and illustrated scene (e.g. "Annie pets an alligator")
- **Parent customization** — replace any character name with a family member's name and face
- **Cartoon face generation** — upload a photo and generate a cartoon version via the Replicate API
- **Encouraging feedback** — animated success/retry modals with confetti

## Getting Started

### Install dependencies

```bash
cd AlphabetApp
npm install
```

### Run the app

```bash
# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run in web browser
npx expo start --web
```

### Add assets

Before building for production, add image assets to the `/assets` folder:
- `icon.png` (1024×1024)
- `splash.png` (splash screen)
- `adaptive-icon.png` (Android)

See `assets/README.txt` for details.

## Parent Setup

### Accessing Parent Setup

1. On the home screen, tap **⚙️ Parent Setup**
2. Enter the PIN: **1234**
3. You'll be taken to the setup screen

> **Note:** The PIN is hardcoded in `app/index.tsx`. To change it, search for `'1234'` in that file and update it.

### Setting Up Replicate API (for Cartoon Faces)

1. Go to [replicate.com](https://replicate.com) and create a free account
2. Navigate to your [API tokens page](https://replicate.com/account/api-tokens)
3. Create a new token (starts with `r8_`)
4. In the app, open **Parent Setup → 🔑 Replicate API Key**
5. Paste your token and tap **Save Key**

### Customizing a Letter

1. Open **Parent Setup**
2. Tap any letter in the list
3. **Change the name** — type a new name (e.g., replace "Annie" with your child's name)
4. **Add a face photo** — tap "Choose Photo & Crop Face" to select and crop a photo
5. **Generate cartoon** — tap "Generate Cartoon Face" to create a cartoon version (requires API key)
6. Tap **Save** — the changes appear immediately in the learning screens

Letters with customizations show a colored dot in the home screen grid.

### How Cartoon Generation Works

The app sends your cropped face photo to the [Replicate API](https://replicate.com) using the `catacolabs/cartoonify` model. Generation takes 20–60 seconds. The cartoon is saved locally on the device and used as the character face in scenes.

## Project Structure

```
AlphabetApp/
├── app/
│   ├── _layout.tsx          # Root navigation layout
│   ├── index.tsx            # Home screen (A-Z grid)
│   ├── learn/
│   │   └── [letter].tsx     # Letter learning + tracing screen
│   └── setup/
│       ├── index.tsx        # Parent setup home
│       └── [letter].tsx     # Per-letter customization
├── src/
│   ├── constants/
│   │   ├── alphabetData.ts  # All 26 letter definitions
│   │   └── letterPaths.ts   # Dot waypoints for tracing each letter
│   ├── components/
│   │   ├── SceneView.tsx    # Cartoon scene illustration
│   │   ├── LetterTracer.tsx # Interactive dot-tracing component
│   │   └── FeedbackModal.tsx# Success/retry animated modal
│   ├── services/
│   │   └── replicateApi.ts  # Replicate API integration
│   └── store/
│       └── alphabetStore.ts # Zustand store with AsyncStorage persistence
└── assets/                  # App icons and splash images
```
