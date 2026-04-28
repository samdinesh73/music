# MusicSync - Real-Time Synchronized Music Website

A real-time synchronized music player where users can watch YouTube videos together in rooms. The host controls playback while joiners sync automatically.

## Features

✨ **Core Features**
- 🎬 Real-time video synchronization using Socket.IO
- 🏠 Room system with unique room IDs
- 👑 Host/Joiner roles with automatic assignment
- ▶️ Play, pause, and seek controls (host only)
- 📱 Live chat for room participants
- 👥 User list showing who's in the room
- 🔄 Automatic sync for late joiners
- 🔌 Graceful host reassignment on disconnect
- 📺 YouTube Iframe API integration

## Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Socket.IO Client
- Lucide Icons

**Backend:**
- Node.js
- Express
- Socket.IO
- UUID

## Project Structure

```
music/
├── frontend/                 # Next.js frontend
│   ├── app/
│   │   ├── page.tsx         # Main app component
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── YouTubePlayer.tsx    # YouTube player component
│   │   ├── RoomJoin.tsx         # Room join/create UI
│   │   └── RoomPlayer.tsx       # Main player room component
│   ├── lib/
│   │   ├── useSocket.ts     # Socket.IO hook
│   │   └── utils.ts         # Utilities
│   ├── .env.local           # Environment variables
│   └── package.json
│
└── backend/                  # Node.js backend
    ├── server.js            # Main server file
    └── package.json
```

## Installation & Setup

### Prerequisites
- Node.js v18+ 
- npm or yarn
- YouTube access (for video URLs)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide

### Creating a Room

1. Open the app at `http://localhost:3000`
2. Click "Create New Room"
3. You'll become the host automatically
4. Share the Room ID with friends

### Joining a Room

1. Click "Join Existing Room"
2. Enter the Room ID shared by the host
3. Enter your name
4. Click "Join Room"
5. You'll sync with the host's current video

### As Host

**Loading Videos:**
- Paste a YouTube URL in the "Load YouTube Video" field
- Press Enter or click "Load"
- Supported formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`

**Controlling Playback:**
- Click "Play" to start video
- Click "Pause" to stop video
- Use the seek bar to jump to specific times
- All actions sync instantly to joiners

**Chat:**
- Type messages in the chat box at the bottom right
- All participants see messages in real-time
- Shows username with each message

### As Joiner

- Watch the video sync automatically with the host
- Send chat messages
- See the host status in the User List
- When the host leaves, the next user becomes host
- When you leave, you return to the main menu

## API Endpoints

### REST APIs

**Create Room:**
```
POST /api/rooms/create
Response: { roomId: "ABC12DEF" }
```

**Get Room Info:**
```
GET /api/rooms/:roomId
Response: {
  roomId: "ABC12DEF",
  userCount: 3,
  host: "socket-id",
  currentVideoId: "dQw4w9WgXcQ",
  currentTime: 45.2,
  isPlaying: true
}
```

**Health Check:**
```
GET /api/health
Response: { status: "ok" }
```

## Socket.IO Events

### Client → Server

**join-room**
```javascript
socket.emit('join-room', {
  roomId: 'ABC12DEF',
  username: 'John'
});
```

**play**
```javascript
socket.emit('play', {
  currentTime: 45.2
});
```

**pause**
```javascript
socket.emit('pause', {
  currentTime: 45.2
});
```

**seek**
```javascript
socket.emit('seek', {
  currentTime: 120.5
});
```

**load-video**
```javascript
socket.emit('load-video', {
  videoId: 'dQw4w9WgXcQ'
});
```

**send-message**
```javascript
socket.emit('send-message', {
  text: 'Hello everyone!'
});
```

### Server → Client

**sync-state** - Initial sync for new joiners
```javascript
socket.on('sync-state', (data) => {
  // { currentVideoId, currentTime, isPlaying, host, users }
});
```

**play** - Host played video
```javascript
socket.on('play', (data) => {
  // { currentTime, timestamp }
});
```

**pause** - Host paused video
```javascript
socket.on('pause', (data) => {
  // { currentTime, timestamp }
});
```

**seek** - Host seeked to position
```javascript
socket.on('seek', (data) => {
  // { currentTime, timestamp }
});
```

**video-loaded** - New video loaded
```javascript
socket.on('video-loaded', (data) => {
  // { videoId, currentTime, isPlaying, timestamp }
});
```

**user-joined** - User entered room
```javascript
socket.on('user-joined', (data) => {
  // { userId, username, userCount, users: [] }
});
```

**user-left** - User left room
```javascript
socket.on('user-left', (data) => {
  // { userId, username, userCount, users: [] }
});
```

**host-changed** - New host assigned
```javascript
socket.on('host-changed', (data) => {
  // { newHostId, newHostUsername }
});
```

**host-assigned** - You've been assigned as host
```javascript
socket.on('host-assigned', () => {
  // You're now the host
});
```

**message** - Chat message received
```javascript
socket.on('message', (data) => {
  // { id, userId, username, text, timestamp }
});
```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Backend (optional)
```
PORT=3001
```

## Key Features Implementation

### Real-Time Sync
- All playback commands (play/pause/seek) are broadcast via Socket.IO
- Timestamps included to handle network delays
- New joiners receive current state immediately

### Host Management
- First user in room becomes host automatically
- Host gets control buttons and receives `host-assigned` event
- If host disconnects, first remaining user becomes new host
- Non-hosts see "Waiting for host to control playback..."

### Late Joiner Sync
- New users receive `sync-state` event with:
  - Current video ID and timestamp
  - Play/pause state
  - List of current users
  - Host information
- Automatic seek to correct position

### Chat System
- Uses Socket.IO for instant message delivery
- Server maintains last 50 messages per room
- Each message includes timestamp and username
- Prevents spam by requiring non-empty messages

### Error Handling
- Automatic reconnection with exponential backoff
- Graceful degradation if backend unavailable
- Room deletion when all users leave
- Socket validation on all emitted events

## Troubleshooting

### "Connecting to server..." Loop
- Ensure backend is running on port 3001
- Check that `NEXT_PUBLIC_SOCKET_URL` is correct in frontend
- Verify no firewall blocking port 3001

### Video Won't Load
- Ensure YouTube URL is valid
- Check that YouTube allows embedded video
- Try different video (some videos don't allow embedding)

### Sync Issues
- Network latency can cause brief desync
- Seek events auto-correct within 1 second
- Refresh page if sync is stuck

### Others Can't Join
- Share the exact Room ID from the header
- Ensure both users are on the same network/server
- Check that Socket.IO connection shows as connected

## Development

### Running Tests
Currently no automated tests. Manual testing recommended:
1. Start backend: `npm run dev` in backend/
2. Start frontend: `npm run dev` in frontend/
3. Open in multiple browser tabs/windows
4. Test playback sync

### Adding Features

**New Socket Events:**
1. Add emission in component using `socket.emit()`
2. Add listener in backend `socket.on()`
3. Add reception in component `socket.on()`

**New React Components:**
1. Add component to `frontend/components/`
2. Import and use in `page.tsx` or other components
3. Style with Tailwind CSS

## Deployment

### Frontend (Vercel - Recommended)
```bash
vercel
```

### Backend (Railway/Render/Heroku)
```bash
# Set environment variables on hosting platform
PORT=your_port

# Deploy repository
git push
```

Remember to update `NEXT_PUBLIC_SOCKET_URL` in frontend to production backend URL.

## Performance Considerations

- Rooms auto-delete when empty (frees memory)
- Message history limited to 50 per room
- Socket.IO reconnection configured for stability
- Efficient seek bar (1-second updates only)

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 13+)
- YouTube embedding required

## License

MIT License - Feel free to use and modify

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Verify all dependencies are installed
3. Check browser console for errors
4. Ensure ports 3000 and 3001 are available

---

Enjoy syncing videos with friends! 🎵🎬
