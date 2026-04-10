# EmoLearn: Smart Emotion-Based Learning Web Platform

EmoLearn is an innovative educational platform that leverages Artificial Intelligence to detect student emotions in real-time and adapt learning content accordingly. By bridging the gap between emotional state and educational delivery, EmoLearn creates a more personalized and effective learning environment.

## 🚀 Key Features

- **AI-Powered Emotion Detection**: Uses the camera to analyze facial expressions and detect emotions like Focused, Confused, Bored, or Happy using Google Gemini AI.
- **Adaptive Content Generation**: Automatically adjusts the complexity and style of educational materials based on the student's current emotional state.
- **Interactive AI Tutor**: A built-in chat assistant that provides real-time support and explanations.
- **Teacher Dashboard**: Allows educators to monitor class-wide engagement and emotional trends.
- **Admin Control Center**: Comprehensive system oversight, user management, and global analytics.
- **Real-time Analytics**: Visualizes emotional data using interactive charts (Recharts).

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Motion (framer-motion).
- **Backend**: Node.js, Express.js.
- **AI/ML**: Google Gemini AI API (@google/genai).
- **Database & Auth**: Firebase Firestore (NoSQL) and Firebase Authentication (Google Login).
- **Icons & UI**: Lucide React, Recharts.

## 📁 Project Structure

```text
├── src/
│   ├── components/       # UI Components (Dashboard, LearnPage, AdminPanel, etc.)
│   ├── services/         # API services (Gemini, Firebase)
│   ├── lib/              # Utilities (cn helper)
│   ├── types.ts          # TypeScript interfaces
│   ├── firebase.ts       # Firebase configuration and helpers
│   └── App.tsx           # Main application logic and routing
├── server.ts             # Express server with Vite middleware integration
├── firestore.rules       # Security rules for the database
└── firebase-blueprint.json # Database structure definition
```

## ⚙️ Setup & Installation

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Create a `.env` file with the following:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - Firebase configuration details (found in `firebase-applet-config.json`).
4. **Run Development Server**:
   ```bash
   npm run dev
   ```
5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## 🛡️ Security

The project implements strict Firebase Security Rules to ensure:
- Users can only access their own emotional logs.
- Teachers can view logs for their assigned classes.
- Administrators have full oversight of system performance and user roles.

## 📄 License

This project was developed as part of a final year project submission.

---
**Developed by:** Sindhu S
**Project Name:** Smart Emotion-Based Learning Web Platform
**Domain:** Web Development
