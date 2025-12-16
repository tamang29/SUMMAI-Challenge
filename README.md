# SUMMAI-Challenge
BPMN Real-Time Collaboration Challenge:

To know more about the challenge click [here](https://github.com/SUMM-AI-Github/2025-summai-challenge).

## 🧩 Core Features

- Render BPMN diagrams in the browser using **bpmn.io** (`bpmn-js`). ✅
- Edit the diagram - changes should appear live for all connected users. ✅
- Show a simple "online users" indicator. ✅
- Store the current BPMN diagram in memory (no need for a DB). ✅

**Bonus:** show a lock/marker when another user is editing a BPMN element. ✅

## 📦 Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Docker & Docker Compose** (optional, for containerized deployment)

## 🚀 Installation & Setup

### Quick Start (Recommended)

Run both services with a single command from the root directory:

```bash
npm install          # Install all dependencies (root, server, webapp)
npm run dev          # Start both backend and frontend concurrently
```

The backend server will run on `http://localhost:8000` and frontend on `http://localhost:5173` with automatic WebSocket connection.

---

### Option 1: Local Development (Separate Terminals)

#### Install Dependencies

**From root directory:**
```bash
npm install
```

This installs dependencies for root, server, and webapp (using npm workspaces).

#### Start Services Separately

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend Dev Server:**
```bash
npm run webapp
```
---

### Option 2: Docker Deployment

#### 1. Build and Run with Docker Compose

```bash
docker-compose up --build
```
OR with newer syntax

```bash
docker compose up --build
```

This will:
- Build the backend server image
- Build the frontend webapp image
- Start both services in containers
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

### Option 3: ngrok Deployment (for external access)

#### 1. Start Local Services

Follow **Option 1** above to run both backend and frontend locally.

#### 2. Expose with ngrok

**Terminal 3 - Backend:**
```bash
ngrok start --all
```

You'll get two URLs:
- Backend: `https://xxxxx-xx-xxx-xxx.ngrok-free.app` (for port 8000)
- Frontend: `https://yyyyy-yy-yyy-yyy.ngrok-free.app` (for port 5173)

#### 3. Update WebSocket URL

Edit `webapp/.env.local`:
```
VITE_WS_URL=wss://xxxxx-xx-xxx-xxx.ngrok-free.app
```

#### 4. Restart Services

From the root directory:
```bash
npm run dev
```

Now your app is accessible globally via ngrok URLs!

---

## 🧪 Testing the App

### Testing Locally

1. **Open Browser - First User:**
   - Go to `http://localhost:5173`
   - You should see the BPMN editor load

2. **Open Incognito Tab - Second User:**
   - Open an incognito/private tab in the same browser
   - Go to `http://localhost:5173`
   - This creates a separate session with a different user_id

3. **Alternative: Different Browser:**
   - Open the URL in a different browser or device on your network
   - Each browser will have its own unique user_id

4. **Verify Real-Time Collaboration:**
   - Edit the diagram in one tab/browser
   - Changes should appear instantly in the other tab/browser
   - Check the "online users" indicator - it should show `1` (one unique user) if both tabs are from the same browser, or `2` if from different browsers/devices
   - Close one tab/browser and verify the user count updates correctly

---

## 👥 User Activity Indicators

The application displays real-time activity markers to help users see what others are doing:

### Activity Legend

- **Blue Border** - Indicates that another user has selected an element in the diagram
- **Green Border** - Indicates that another user is currently dragging/moving an element

These visual indicators appear in real-time as other users interact with the diagram, allowing for better collaboration awareness. Your own selections and drags are not highlighted locally, only other users' activities are visible to you.

### Testing with ngrok (Optional)

If you've configured ngrok, replace `http://localhost:5173` with your ngrok frontend URL (e.g., `https://yyyyy-yy-yyy-yyy.ngrok-free.app`) and follow the same steps above to test collaboration across different networks.
