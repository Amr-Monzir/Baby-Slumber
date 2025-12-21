# Building the BabySleep Android APK

This guide explains how to build an Android APK from the BabySleep React web app using Capacitor.

## Prerequisites

Before building the APK, you'll need to install the following on your local machine:

1. **Node.js** (v18 or higher)
2. **Android Studio** (latest version)
3. **Android SDK** (installed via Android Studio)
4. **Java JDK 17** (required by Android Studio)

## Step 1: Clone the Repository

Clone this repository to your local machine:

```bash
git clone <your-replit-git-url>
cd <project-folder>
npm install
```

## Step 2: Build the Web App

Generate the production build of the web app:

```bash
npm run build
```

This creates the `dist/public` folder with the compiled web assets.

## Step 3: Add the Android Platform

Run the following command to add the Android platform to Capacitor:

```bash
npx cap add android
```

This creates the `android/` folder with the native Android project.

## Step 4: Sync Capacitor

After any changes to the web app, sync the changes to the native project:

```bash
npx cap sync
```

## Step 5: Open in Android Studio

Open the Android project in Android Studio:

```bash
npx cap open android
```

Or manually open the `android/` folder in Android Studio.

## Step 6: Build the APK

In Android Studio:

1. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Wait for the build to complete
3. Find the APK in `android/app/build/outputs/apk/debug/app-debug.apk`

### For a Release APK (signed):

1. Go to **Build > Generate Signed Bundle / APK**
2. Select **APK**
3. Create a new keystore or use an existing one
4. Choose **release** build variant
5. Complete the signing wizard

The signed APK will be in `android/app/build/outputs/apk/release/app-release.apk`

## Step 7: Install on Device

### Via ADB:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via File Transfer:
Transfer the APK to your Android device and install it manually.

## Configuration

The Capacitor configuration is in `capacitor.config.ts`:

- **appId**: `com.babysleep.whitenoise` (change this for Play Store)
- **appName**: `BabySleep`
- **webDir**: `dist/public` (where the built web assets are)

## Customizing the App Icon

Replace the icon files in:
- `android/app/src/main/res/mipmap-*` folders

Use Android Studio's **Asset Studio** (Right-click res folder > New > Image Asset) to generate all required icon sizes from your source image.

## Troubleshooting

### Build fails with SDK errors
Make sure you have Android SDK 34 or higher installed via Android Studio's SDK Manager.

### App crashes on launch
Check the Logcat in Android Studio for error messages. Common issues:
- Missing web assets (run `npm run build` and `npx cap sync`)
- Incorrect webDir in capacitor.config.ts

### Audio doesn't play in background
For background audio, you may need to implement a native Android Foreground Service. The current web-based audio may be paused by the system when the app is backgrounded.
