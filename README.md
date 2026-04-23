# Lontera 🔮

Lontera is a high-fidelity, real-time collaboration platform inspired by Discord, built with a "Neon-Dark" aesthetic. It features real-time chat, WebRTC voice/video calls, and private direct messaging.

## ✨ Features

-   **Deep Neon UI**: Custom glassmorphism and neon accents powered by Tailwind CSS.
-   **Rich Text Chat**: Powered by Firebase Firestore with Markdown and code block support.
-   **Voice & Video Calls**: P2P communication built with WebRTC and Firestore signaling.
-   **Direct Messaging**: Secure private conversations between users.
-   **User Profiles**: Customizable statuses and display names with real-time sync.
-   **Global State**: Robust React Context for app-wide data management.

## 🚀 Deployment (Vercel)

1.  **Export to GitHub**: Use the AI Studio "Export to GitHub" feature.
2.  **Import to Vercel**: Connect your repository to Vercel.
3.  **Environment Variables**: You **MUST** add the following variables in Vercel's Project Settings > Environment Variables:
    -   `VITE_FIREBASE_API_KEY`
    -   `VITE_FIREBASE_AUTH_DOMAIN`
    -   `VITE_FIREBASE_PROJECT_ID`
    -   `VITE_FIREBASE_STORAGE_BUCKET`
    -   `VITE_FIREBASE_MESSAGING_SENDER_ID`
    -   `VITE_FIREBASE_APP_ID`
    -   `VITE_FIREBASE_MEASUREMENT_ID`
    -   `GEMINI_API_KEY` (Required for AI features)

## 🛠️ Local Development

1.  Clone the repository:
    ```bash
    git clone <your-repo-url>
    cd lontera
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file based on `.env.example` and fill in your Firebase credentials.
4.  Run the development server:
    ```bash
    npm run dev
    ```

## 🔒 Security

Firestore security rules are located in `firestore.rules`. These ensure that:
-   Users can only read/write their own messages.
-   DMs are only visible to participants.
-   Voice channel status is strictly managed.
-   WebRTC signaling is secure.

## 🤝 Collaboration

This project uses GitHub Actions for CI/CD. Ensure all linting passes before merging PRs.
Workflow is defined in `.github/workflows/ci.yml`.
