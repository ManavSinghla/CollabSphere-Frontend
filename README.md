# CollabSphere Frontend

This is the frontend component of **CollabSphere**, a real-time team collaboration platform built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO.

## Features Built
- **Authentication:** JWT-based login and registration.
- **Workspaces:** Create and switch between dedicated team workspaces.
- **Real-Time Chat:** Slack-like instant messaging in public/private channels using Socket.IO.
- **Collaborative Documents:** A Notion-like rich text editor (`react-quill`) where multiple users can type in real-time, synced via WebSockets with debounced auto-saving.
- **Premium UI:** Beautiful dark mode interface built with TailwindCSS and Lucide Icons.

## Architecture Overview

CollabSphere relies on a decoupled Client-Server model.

1. **State Management:** We use **Zustand** (e.g. `authStore.js`, `chatStore.js`) for managing global data without prop drilling.
2. **REST API (Axios):** Standard operations (like creating a workspace or loading past messages) are handled via standard HTTP requests to the backend.
3. **WebSockets (Socket.IO):** For real-time updates (like sending a chat message or typing in a document), the frontend maintains a persistent Socket.IO connection. The backend listens for these events and instantly broadcasts them to other users in the same "room" or "channel".

## Setup & Deployment

### Local Development
```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

*(Make sure your Node.js backend server is running concurrently on port 5000)*

### Environment Variables
For local development, the application assumes your backend runs on `http://localhost:5000`. To point the frontend to a production backend, create a `.env` file:
```
VITE_API_URL=https://your-backend.onrender.com
```

### Vercel Deployment
To deploy this on Vercel:
1. Ensure the `.npmrc` file exists to handle peer-dependency resolutions for React 19.
2. In the Vercel dashboard, set the Root Directory to `CollabSphere Frontend`.
3. Add the `VITE_API_URL` environment variable pointing to your deployed backend.
