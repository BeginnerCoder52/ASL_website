# EduGlyph - AI-Powered ASL Meeting Platform

## AI Agent Role
You are acting as a Senior Web Developer and Backend AI Expert. 

## Project Overview
EduGlyph (formerly ASL_WEBSITE) is a specialized online meeting platform designed to function like Google Meet, but tailored specifically for students using American Sign Language (ASL). 

## Conversation & Git History Summary
Based on the recent repository commits, our collaborative efforts have focused on:
1. **Core Feature Implementation:** Building a real-time meeting room interface integrating a dual camera setup, microphone, live subtitles, and a shared whiteboard.
2. **AI Integration:** Integrating a Keras-based deep learning model (`model_acc98.02`) and Google's MediaPipe for real-time ASL hand sign detection and tracking.
3. **Media Handling & Stability:** Extensive refactoring of React components (`CameraFeed`, `VideoTile`, `MeetingRoom`, `Microphone`, `Subtitle`, `Whiteboard`) to ensure proper cleanup of media streams (unmounting), error handling, and stable references to prevent memory leaks and re-renders.
4. **Deployment & Infrastructure Fixes:** 
   - Deploying the frontend to **Vercel** and the backend to **Render**.
   - Resolving OpenCV deployment issues on Render by creating a custom Dockerfile installing `libegl1`.
   - Fixing Gunicorn WebSocket issues by migrating from `eventlet` to `gevent`.

## Core Algorithms for ASL Google Meet Clone
To achieve a scalable "Google Meet for ASL" environment, the system utilizes the following algorithmic flows:

1. **ASL Recognition Pipeline (Current):**
   - **Capture:** Frontend captures webcam frames and sends them via base64 encoded strings to the backend.
   - **Feature Extraction:** Backend decodes the image, uses `MediaPipe` to locate 21 hand landmarks, and flattens them into a 42-dimensional vector.
   - **Inference:** The processed landmarks are fed into the Keras neural network to predict the ASL sign.
   - **Feedback:** The backend draws the skeleton on the frame and returns it to the client along with the prediction confidence.

2. **Real-Time Communication (RTC) Architecture:**
   - **Current State:** Using `Socket.IO` for signaling, real-time chat, whiteboard syncing, and subtitle broadcasting.
   - **Ideal Scale (The "Google Meet" approach):** Sending base64 video frames over HTTP/WebSockets to a Python backend is computationally heavy and causes high latency. To replicate Google Meet, the system should transition to **WebRTC**. WebRTC handles peer-to-peer (P2P) or client-to-server video/audio streaming with minimal latency.

## Web Service Infrastructure & Scaling Limitations

### Current Services:
- **Frontend (Vercel):** Excellent for hosting the React SPA. However, Vercel relies on serverless functions. Serverless architectures enforce strict timeouts (10s - 60s) and do not support persistent connections, making them entirely unsuited for hosting WebSockets or WebRTC signaling servers.
- **Backend (Render):** Used for the Flask + Socket.IO + AI inference server. While it supports persistent connections (unlike Vercel), the free/low-tier instances often sleep and lack the heavy CPU/GPU resources required to process computer vision frames for multiple concurrent users.

### Recommended FREE Web Services for Multi-User Meetings & AI Backend:
If Render struggles with the load and Vercel cannot handle WebSockets, consider the following FREE (or generous free-tier) services tailored for multi-user real-time video and AI processing:

1. **Managed WebRTC Services (Generous Free Tiers for Frontend/Meeting):**
   - **LiveKit Cloud:** Offers a very generous free tier (50GB bandwidth/month) for real-time video/audio routing. Perfect for React integration.
   - **Daily.co:** Provides 10,000 free participant minutes per month. Very easy to integrate for multi-person video calls.
   - **Agora:** Offers 10,000 free minutes per month. High quality and globally distributed.
   *(Note: With these WebRTC PaaS, you can shift the AI inference to the client-side using MediaPipe JS / TensorFlow.js, which costs $0 in backend compute).*

2. **Backend AI Processing Servers (Free Tiers):**
   - **Render (Current):** Free tier works for basic WebSocket connections and lightweight AI, but goes to sleep after 15 minutes of inactivity and has limited CPU/RAM.
   - **Hugging Face Spaces:** Offers free basic Docker environments (2 vCPU, 16GB RAM) which are often more powerful than Render's free tier. You can host your Flask + Socket.IO + Keras model here.
   - **Koyeb:** Generous free tier (1 vCPU, 512MB RAM) with Docker support. Often faster startup times than Render.
   - **Fly.io:** Allows deploying Docker containers with a free tier. Good for WebSocket applications as they allow persistent connections.

3. **Database / Real-time Sync (Free Alternatives to Socket.IO for signaling):**
   - **Firebase Realtime Database / Firestore:** Excellent free tier for syncing meeting state, chat, and whiteboard data if you move away from a dedicated WebSocket server.
   - **Supabase:** Open-source Firebase alternative with a great free tier, including real-time subscriptions (PostgreSQL + WebSockets).

4. **Frontend Database & Authentication (Multi-device Login):**
   To allow users to create accounts, log in from different browsers/devices, and save their data (meeting history, preferences), use Backend-as-a-Service (BaaS) platforms with generous free tiers:
   - **Clerk:** The best auth service for React/Vercel right now. 10,000 free monthly active users. Handles login UI out of the box.
   - **Firebase Authentication + Firestore:** Free, robust, and highly integrated. Can store user profiles across devices.
   - **Supabase (Auth + PostgreSQL):** Perfect if you prefer SQL databases. 50,000 free monthly active users.
   - **MongoDB Atlas:** Free 512MB cloud database cluster. Great if you want to write a custom Express.js/Flask login backend.

## Mobile Responsiveness & UI Flexibility (Google Meet Clone)
To ensure the meeting platform looks professional and functions properly on mobile phones and tablets, implement the following frontend strategies:

1. **Dynamic Video Grids (Auto-layout):**
   - Use **CSS Grid / Flexbox** coupled with JavaScript (React state) to calculate how many participants are in the room and dynamically assign column/row spans (e.g., 1x1, 1x2, 2x2, 3x3 grids).
   - Use `object-fit: cover` on `<video>` and `<canvas>` elements to ensure the video fills the tile without stretching, while keeping the aspect ratio when the phone rotates.

2. **Mobile-First UI Controls:**
   - **Bottom/Floating Control Bar:** Move the microphone, camera, and end-call buttons to a fixed bottom bar.
   - **Collapsible Panels:** On mobile screens, hide the Chat, Participant List, and Whiteboard behind toggle buttons to save space. Use conditional rendering in React or CSS media queries (`@media (max-width: 768px)`).

3. **Touch-Enabled Interactions:**
   - The Whiteboard must support touch events (`onTouchStart`, `onTouchMove`, `onTouchEnd`) since mouse events (`onMouseDown`) don't work natively on smartphones.
   - Add pinch-to-zoom support for viewing the main speaker or the whiteboard.