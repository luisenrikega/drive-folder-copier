# Drive Folder Copier

A sleek, modern Chrome extension to duplicate Google Drive folders and their contents with elegance.

## Features

- **Dual Language Support**: Automatically detects browser language (Spanish/English).
- **Glassmorphism UI**: Beautiful, modern design with smooth animations.
- **Efficient Copying**: Paginates through large folders (>100 files) to ensure nothing is missed.
- **Secure**: Uses Google OAuth 2.0 directly via Chrome's identity API. No data is sent to external servers.

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** in the top right.
4. Click **Load unpacked** and select this folder.

## Setup

To use this extension, you must set up a Google Cloud Project:

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Drive API**.
3. Configure the **OAuth consent screen**.
4. Create **OAuth 2.0 Client IDs** (Chrome extension).
5. Copy the Client ID and replace the `client_id` in `manifest.json`.

## Privacy Policy

The privacy policy can be found in `privacy-policy.html`. In summary: We do not collect, store, transmit, or sell any of your personal data. Everything happens locally in your browser.

---

*Made with elegance for Google Drive.*
