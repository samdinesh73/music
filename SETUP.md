# MusicSync - Step-by-Step Setup Guide

## Prerequisites

Before you start, make sure you have:
- **Node.js v18+** - [Download](https://nodejs.org/)
- **npm** - Comes with Node.js
- **A text editor** - VS Code recommended
- **Terminal/Command Prompt** - For running commands

## Installation Steps

### Step 1: Navigate to Project Directory

Open Terminal/Command Prompt and navigate to the music directory:

**Windows (PowerShell):**
```powershell
cd "C:\Users\SR\OneDrive\Desktop\music"
```

**Mac/Linux:**
```bash
cd ~/Desktop/music
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

This installs:
- `express` - Web server
- `socket.io` - Real-time communication
- `cors` - Cross-origin requests
- `uuid` - Room ID generation

### Step 3: Start Backend Server

```bash
npm run dev
```

You should see:
```
🎵 Music Sync Server running on http://localhost:3001
```

✅ **Backend is running!** Keep this terminal open.

### Step 4: Install Frontend Dependencies (New Terminal)

Open a **new terminal** (don't close the backend one) and:

```bash
cd frontend
npm install
```

This installs:
- `next` - React framework
- `react` - UI library
- `socket.io-client` - Socket connection
- `tailwindcss` - Styling
- Other dependencies

### Step 5: Start Frontend Server

In the frontend terminal:

```bash
npm run dev
```

You should see:
```
▲ Next.js 16.2.4
- Ready in XXms
- Local: http://localhost:3000
```

### Step 6: Open in Browser

Open your browser and go to:
```
http://localhost:3000
```

✅ **You're ready to use MusicSync!**

---

## First Test - Basic Flow

### Test 1: Create Room (Host)

1. On `http://localhost:3000`, click **"Create New Room"**
2. Wait for the page to load
3. You'll see:
   - A **Room ID** at the top (e.g., "ABC12DEF")
   - **YouTube URL input** field
   - **Play/Pause buttons**
   - **Users list** showing you as "Host"

### Test 2: Join Room (Joiner)

1. **Open a new browser tab** at `http://localhost:3000`
2. Click **"Join Existing Room"**
3. Enter the **Room ID** from Step 1
4. Enter your name (e.g., "Friend")
5. Click **"Join Room"**

You should see:
- Same YouTube player
- User list showing both users
- Host indicator next to your name

### Test 3: Play Video (Host)

Back in the **first tab** (Host):

1. Paste a YouTube URL:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
2. Click **"Load"** button
3. Video should appear in the player
4. Click **"Play"**

In the **second tab** (Joiner):
- Video plays automatically
- Chat shows sync status
- Current time syncs in real-time

### Test 4: Control Playback

As Host:
- Click **"Pause"** → Both tabs pause
- Use **seek bar** → Both jump to that time
- Click **"Play"** → Both play

### Test 5: Test Chat

Either tab:
1. Type a message in the chat box (bottom right)
2. Press Enter or click send icon
3. Message appears in both tabs with your name

### Test 6: Late Joiner

1. **Create a new room** in a third tab
2. Load and play a video in the host tab
3. Let it play for 30 seconds
4. Join from another tab
5. New joiner automatically syncs to the current video and time

---

## Common Issues & Solutions

### Issue: "Connecting to server..." keeps showing

**Solution:**
1. Check backend is running (see blue terminal with "🎵 Music Sync Server")
2. If not, go to backend terminal and run: `npm run dev`
3. Refresh frontend page (Ctrl+R or Cmd+R)

### Issue: Backend won't start - "Port 3001 already in use"

**Solution:**
```bash
# Windows: Find and kill process using port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3001
kill -9 <PID>
```

Then try again:
```bash
npm run dev
```

### Issue: YouTube video won't load

**Solution:**
1. Check URL format - must include video ID
2. Some videos don't allow embedding (try a different one)
3. Try these test videos:
   - `https://www.youtube.com/watch?v=dQw4w9WgXcQ` (Rick Roll)
   - `https://www.youtube.com/watch?v=jNQXAC9IVRw` (Me at the zoo)

### Issue: Sync is out of step

**Solution:**
1. This can happen with network delay
2. Host should click the video bar to sync again
3. Auto-sync happens if off by >1 second

### Issue: Can't join room - "Room not found"

**Solution:**
1. Double-check Room ID (capital letters, no spaces)
2. Host must have created room first
3. Room auto-deletes if host leaves before joiners join
4. Create a new room and try again

---

## Project Structure

After setup, your project looks like:

```
music/
├── backend/
│   ├── server.js           # Main server code
│   ├── package.json        # Backend dependencies
│   └── README.md           # Backend info
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx        # Main app
│   │   ├── layout.tsx      # Layout
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── YouTubePlayer.tsx
│   │   ├── RoomJoin.tsx
│   │   └── RoomPlayer.tsx
│   ├── lib/
│   │   ├── useSocket.ts    # Socket hook
│   │   └── utils.ts
│   ├── package.json
│   └── .env.local          # Config
│
├── README.md               # Full documentation
└── SETUP.md                # This file
```

---

## Running Commands Reference

### Backend

```bash
# Start development server
npm run dev

# Start production server
npm start

# Install dependencies
npm install
```

**Location:** Open terminal in `music/backend/` folder

### Frontend

```bash
# Start development server
npm run dev

# Build for production
npm build

# Start production build
npm start

# Run linter
npm run lint

# Install dependencies
npm install
```

**Location:** Open terminal in `music/frontend/` folder

---

## Stopping Servers

### Backend (Terminal 1)
Press: `Ctrl + C`

### Frontend (Terminal 2)
Press: `Ctrl + C`

---

## Next Steps

1. ✅ **Test with friends** - Share room ID for real-time sync
2. 📝 **Customize** - Change colors in Tailwind CSS
3. 🎨 **Add features** - Chat emojis, video recommendations, etc.
4. 🚀 **Deploy** - Use Vercel (frontend) + Railway (backend)

---

## Getting Help

1. Check the **main README.md** for API documentation
2. Check browser console for errors (F12 → Console)
3. Check backend terminal for error messages
4. Verify ports 3000 and 3001 are accessible
5. Try restarting both servers

---

## System Requirements

| Item | Minimum | Recommended |
|------|---------|-------------|
| CPU | Dual-core | Quad-core |
| RAM | 2GB | 4GB |
| Disk | 500MB | 1GB |
| Node | v18 | v20+ |
| Bandwidth | 1Mbps | 5Mbps |

---

Enjoy your MusicSync setup! 🎵🎬

If you encounter any issues, double-check that:
1. Both servers are running
2. You're using the correct URLs (localhost:3000 and localhost:3001)
3. Ports 3000 and 3001 are not blocked by firewall
4. Node.js and npm are properly installed
