# MusicSync Architecture & Features

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS (Browsers)                         │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────┐│
│  │  Host Tab   │ ◄─────► │ Socket.IO ◄─────────────┤ Join Tab ││
│  │ (Host Role) │ (WS)    │ Connection  │  (WS)    │(Joiner) ││
│  └──────────────┘         └──────────────┘         └──────────┘│
│         │                        │                      │        │
│         │ HTTP/WS               │ HTTP/WS              │        │
└─────────┼────────────────────────┼──────────────────────┼────────┘
          │                        │                      │
          ▼                        ▼                      ▼
    ┌─────────────────────────────────────────────────────────────┐
    │              FRONTEND (Next.js on localhost:3000)            │
    │                                                              │
    │  ┌─────────────────────────────────────────────────────┐   │
    │  │ page.tsx (Main App Logic)                            │   │
    │  │ - Manages room state (create/join/leave)            │   │
    │  │ - Socket connection initialization                  │   │
    │  │ - Route between RoomJoin and RoomPlayer             │   │
    │  └─────────────────────────────────────────────────────┘   │
    │                         │                                    │
    │         ┌───────────────┴───────────────┐                   │
    │         ▼                               ▼                   │
    │  ┌──────────────────┐           ┌──────────────────┐       │
    │  │   RoomJoin       │           │  RoomPlayer      │       │
    │  │  (Components)    │           │  (Main View)     │       │
    │  │                  │           │                  │       │
    │  │ - Create Room    │           │ - Player UI      │       │
    │  │ - Join Room      │           │ - Controls       │       │
    │  │ - Get Room ID    │           │ - Chat           │       │
    │  └──────────────────┘           │ - User List      │       │
    │                                 └──────────────────┘       │
    │                                         │                   │
    │                    ┌────────────────────┼────────────────┐ │
    │                    ▼                    ▼                ▼ │
    │           ┌──────────────┐    ┌──────────────┐  ┌──────────┐
    │           │YouTubePlayer │    │  useSocket   │  │Tailwind  │
    │           │               │    │  (Hook)      │  │ CSS      │
    │           │- YT API init │    │              │  │ Styling  │
    │           │- Play/Pause  │    │- Socket init │  │          │
    │           │- Seek        │    │- Event Emit  │  └──────────┘
    │           │- Sync        │    │- Event Listen│  
    │           └──────────────┘    └──────────────┘  
    └─────────────────────────────────────────────────────────────┘
                          │ WebSocket │
                          │  (Port    │
                          │  3000)    │
                          ▼
    ┌─────────────────────────────────────────────────────────────┐
    │        BACKEND (Node.js + Express on localhost:3001)         │
    │                                                              │
    │  ┌─────────────────────────────────────────────────────┐   │
    │  │ server.js (Express + Socket.IO)                      │   │
    │  │                                                      │   │
    │  │ REST Endpoints:                                      │   │
    │  │  - POST /api/rooms/create      → Generate room ID   │   │
    │  │  - GET /api/rooms/:roomId      → Room info          │   │
    │  │  - GET /api/health             → Health check       │   │
    │  └─────────────────────────────────────────────────────┘   │
    │                                                              │
    │  ┌─────────────────────────────────────────────────────┐   │
    │  │ Socket.IO Event Handlers                             │   │
    │  │                                                      │   │
    │  │ Connection Events:                                   │   │
    │  │  ├─ 'join-room'     → Add user to room             │   │
    │  │  ├─ 'disconnect'    → Cleanup + reassign host      │   │
    │  │  └─ 'error'         → Handle errors               │   │
    │  │                                                      │   │
    │  │ Playback Events (Host only):                        │   │
    │  │  ├─ 'play'         → Emit to all in room           │   │
    │  │  ├─ 'pause'        → Emit to all in room           │   │
    │  │  ├─ 'seek'         → Emit to all in room           │   │
    │  │  └─ 'load-video'   → Emit to all in room           │   │
    │  │                                                      │   │
    │  │ Chat Events:                                         │   │
    │  │  └─ 'send-message' → Broadcast with metadata       │   │
    │  └─────────────────────────────────────────────────────┘   │
    │                                                              │
    │  ┌─────────────────────────────────────────────────────┐   │
    │  │ Data Storage (In-Memory)                             │   │
    │  │                                                      │   │
    │  │ const rooms = Map {                                  │   │
    │  │   'ABC12DEF': {                                      │   │
    │  │     host: 'socket-123',                              │   │
    │  │     users: ['socket-123', 'socket-456'],            │   │
    │  │     currentVideoId: 'dQw4w9WgXcQ',                   │   │
    │  │     currentTime: 45.2,                               │   │
    │  │     isPlaying: true,                                 │   │
    │  │     messages: [...]                                  │   │
    │  │   }                                                  │   │
    │  │ }                                                    │   │
    │  │                                                      │   │
    │  │ const users = Map {                                  │   │
    │  │   'socket-123': {                                    │   │
    │  │     roomId: 'ABC12DEF',                              │   │
    │  │     username: 'John',                                │   │
    │  │     isHost: true                                     │   │
    │  │   }                                                  │   │
    │  │ }                                                    │   │
    │  └─────────────────────────────────────────────────────┘   │
    └─────────────────────────────────────────────────────────────┘
                          │ REST/WS │
                          │(Port    │
                          │3001)    │
                          ▼
    ┌─────────────────────────────────────────────────────────────┐
    │              EXTERNAL (Third-Party)                          │
    │                                                              │
    │  ┌──────────────────────────────────────────────────────┐  │
    │  │ YouTube Iframe API                                   │  │
    │  │ (Loaded in browser)                                  │  │
    │  │                                                      │  │
    │  │ - Provides YT.Player object                          │  │
    │  │ - Loads video by ID                                  │  │
    │  │ - Controls: play(), pause(), seekTo()                │  │
    │  │ - Events: onStateChange, onError                     │  │
    │  │ - Methods: getCurrentTime(), getDuration()           │  │
    │  └──────────────────────────────────────────────────────┘  │
    └─────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

### Scenario 1: Create Room (Host)

```
1. User clicks "Create New Room"
   ↓
2. Frontend → POST /api/rooms/create
   ↓
3. Backend generates unique roomId (e.g., "ABC12DEF")
   ↓
4. Backend stores room: rooms.set('ABC12DEF', {...})
   ↓
5. Backend responds with roomId
   ↓
6. Frontend receives roomId
   ↓
7. Frontend emits: socket.emit('join-room', {roomId, username})
   ↓
8. Backend receives 'join-room'
   ├─ room.users.push(socket.id)
   ├─ room.host = socket.id (first user)
   ├─ users.set(socket.id, {..., isHost: true})
   └─ socket.emit('host-assigned')
   ↓
9. Frontend receives 'host-assigned'
   ├─ Sets isHost = true
   └─ Shows play/pause controls
   ↓
10. Host can now load videos and control playback
```

### Scenario 2: Join Room (Joiner)

```
1. User enters Room ID and name → clicks "Join Room"
   ↓
2. Frontend emits: socket.emit('join-room', {roomId, username})
   ↓
3. Backend receives 'join-room'
   ├─ room = rooms.get(roomId)
   ├─ If room doesn't exist → socket.emit('error')
   └─ If room exists:
      ├─ room.users.push(socket.id)
      ├─ users.set(socket.id, {..., isHost: false})
      ├─ socket.emit('sync-state', currentState)
      └─ io.to(roomId).emit('user-joined', {userId, userCount, users})
   ↓
4. Frontend receives 'sync-state'
   ├─ setVideoId(currentVideoId)
   ├─ setCurrentTime(currentTime)
   ├─ setIsPlaying(isPlaying)
   ├─ setUsers(users)
   └─ YouTubePlayer syncs to this state
   ↓
5. Frontend receives 'user-joined' in host tab
   ├─ Updates user list
   └─ Shows "User joined"
   ↓
6. Joiner is now synced and watching
```

### Scenario 3: Host Plays Video

```
1. Host clicks "Load" with YouTube URL
   ↓
2. Frontend extracts videoId from URL
   ↓
3. Frontend emits: socket.emit('load-video', {videoId})
   ↓
4. Backend receives 'load-video' (only accepts from host)
   ├─ room.currentVideoId = videoId
   ├─ room.currentTime = 0
   ├─ room.isPlaying = false
   └─ io.to(roomId).emit('video-loaded', {videoId, currentTime, isPlaying})
   ↓
5. All clients receive 'video-loaded'
   ├─ YouTubePlayer.loadVideoById(videoId)
   └─ Video appears in all tabs
   ↓
6. Host clicks "Play"
   ↓
7. Frontend emits: socket.emit('play', {currentTime})
   ↓
8. Backend receives 'play' (host only)
   ├─ room.isPlaying = true
   ├─ room.currentTime = data.currentTime
   └─ io.to(roomId).emit('play', {currentTime, timestamp})
   ↓
9. All clients receive 'play'
   ├─ YouTubePlayer.playVideo()
   └─ setIsPlaying(true)
   ↓
10. All videos play in sync
```

### Scenario 4: Host Disconnects (Host Reassignment)

```
1. Host closes browser/loses connection
   ↓
2. Backend fires 'disconnect' event
   ↓
3. Backend processes disconnect:
   ├─ room = rooms.get(user.roomId)
   ├─ room.users.splice(socketId) // Remove user
   ├─ If room.host === socket.id:
   │  ├─ If room.users.length > 0:
   │  │  ├─ newHostId = room.users[0]
   │  │  ├─ room.host = newHostId
   │  │  ├─ users.get(newHostId).isHost = true
   │  │  └─ io.to(roomId).emit('host-changed', {newHostId})
   │  └─ Else:
   │     └─ rooms.delete(roomId) // Delete empty room
   └─ users.delete(socket.id)
   ↓
4. Remaining clients receive 'host-changed'
   ├─ New host sees play/pause buttons
   └─ Other joiners see "Waiting for host..."
   ↓
5. New host can now control playback
```

## Component Communication

```
page.tsx (Main)
│
├─ useSocket hook
│  └─ Manages Socket.IO connection
│     └─ Returns: socket, isConnected, emit, on, off
│
├─ RoomJoin (Component)
│  ├─ Called when: not in a room
│  ├─ Props:
│  │  ├─ onCreateRoom: () => void
│  │  ├─ onJoinRoom: (roomId, username) => void
│  │  └─ isLoading: boolean
│  └─ Shows: Create/Join options
│
├─ RoomPlayer (Component)
│  ├─ Called when: in a room
│  ├─ Props:
│  │  ├─ roomId: string
│  │  ├─ username: string
│  │  ├─ isHost: boolean
│  │  ├─ socket: Socket
│  │  └─ onLeaveRoom: () => void
│  │
│  └─ Children:
│     ├─ YouTubePlayer (Component)
│     │  ├─ Props:
│     │  │  ├─ videoId: string
│     │  │  ├─ isPlaying: boolean
│     │  │  ├─ currentTime: number
│     │  │  ├─ onTimeUpdate: (time) => void
│     │  │  ├─ onStateChange: (state) => void
│     │  │  └─ isHost: boolean
│     │  └─ Manages: YouTube Iframe API
│     │
│     └─ Controls & Chat
│        └─ Emits: play, pause, seek, load-video, send-message
│
└─ Socket listeners
   ├─ sync-state
   ├─ play
   ├─ pause
   ├─ seek
   ├─ video-loaded
   ├─ user-joined
   ├─ user-left
   ├─ host-changed
   ├─ host-assigned
   └─ message
```

## State Management Flow

```
Frontend State (page.tsx):
┌─────────────────────────┐
│ roomState {             │
│   roomId: string|null   │ → Room identifier
│   username: string|null │ → User's name
│   isHost: boolean       │ → Is this user host?
│ }                       │
└─────────────────────────┘

RoomPlayer State:
┌────────────────────────────┐
│ videoId: string|null       │ ← From socket: sync-state, video-loaded
│ isPlaying: boolean         │ ← From socket: play, pause
│ currentTime: number        │ ← From socket: seek, play, pause, time-update
│ users: User[]              │ ← From socket: user-joined, user-left, sync-state
│ messages: Message[]        │ ← From socket: message
│ messageInput: string       │ ← Local input state
│ showChat: boolean          │ ← Local UI state
│ copied: boolean            │ ← Local clipboard state
└────────────────────────────┘

YouTubePlayer State:
┌────────────────────────────┐
│ isReady: boolean            │ ← YouTube API loaded
│ playerRef: YT.Player        │ ← Reference to player instance
│ isSyncingRef: boolean       │ ← Prevent feedback loops
└────────────────────────────┘
```

## Event Flow Timing

```
Host plays video:
┌────────────────────────────────────────────────────────────────┐
│ T=0ms    User clicks Play                                       │
│ ├─ handlePlay() called                                          │
│ ├─ socket.emit('play', {currentTime})                           │
│ └─ YouTubePlayer.playVideo() called locally                     │
│                                                                  │
│ T=5ms    Backend receives 'play'                                │
│ ├─ Updates room state                                           │
│ └─ io.to(roomId).emit('play', ...) broadcasts                   │
│                                                                  │
│ T=10-50ms All clients receive 'play' (network latency)          │
│ ├─ YouTubePlayer syncs                                          │
│ ├─ State updated                                                │
│ └─ UI shows playing                                             │
│                                                                  │
│ T=50ms+ Video plays in all tabs                                 │
│ ├─ Host tracks currentTime every 1 second                       │
│ └─ Host emits on significant changes (seek)                     │
│                                                                  │
│ Joiner joins at T=100ms                                         │
│ ├─ Backend receives 'join-room'                                 │
│ ├─ Sends 'sync-state' with current videoId, time, state        │
│ └─ Joiner syncs to exact position within 50-100ms              │
└────────────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

```
Network Issues:
├─ Socket disconnected
│  └─ Frontend shows: "Connecting to server..."
│  └─ Socket.IO auto-reconnects
│
├─ Backend unavailable
│  └─ Frontend infinite loading
│  └─ Show error: "Cannot connect to server"
│
└─ Room not found
   └─ Backend emits: 'error'
   └─ Frontend shows: "Room not found"

YouTube Issues:
├─ Video not embedding
│  └─ Show error in player area
│
├─ Invalid URL
│  └─ Extraction returns null
│  └─ Load button disabled
│
└─ Video restricted
   └─ YouTube player emits onError
   └─ Frontend logs error

Sync Issues:
├─ Time difference > 1 second
│  └─ Auto-seek to correct time
│
└─ Out of sync
   └─ User can manually click seek bar
```

## Performance Optimizations

```
Frontend:
├─ useSocket hook memoizes functions
├─ YouTubePlayer memoizes callbacks with useCallback
├─ Socket listeners cleanup on unmount
├─ Chat limited to recent messages (UI scroll only)
└─ Message history on server capped at 50

Backend:
├─ Rooms auto-deleted when empty
├─ Socket.IO namespacing per room (rooms emit to roomId only)
├─ No database queries (in-memory)
├─ Efficient Map-based lookups
└─ Timeouts cleaned up on disconnect

Network:
├─ Events batched where possible
├─ No polling (event-driven)
├─ Binary serialization via Socket.IO
└─ Timestamps prevent duplicate processing
```

## Security Considerations

```
Current Implementation:
├─ No authentication
├─ No room privacy (join if you know ID)
├─ No message moderation
└─ Client-side trusts host control

Production Recommendations:
├─ Add JWT authentication
├─ Rate limit socket events
├─ Validate all input data
├─ Sanitize chat messages (XSS prevention)
├─ Add room passwords
├─ Log suspicious activity
├─ Implement room access control lists
└─ Add message length/frequency limits
```

---

This architecture provides:
- ✅ Real-time synchronization
- ✅ Scalable room system
- ✅ Clean separation of concerns
- ✅ Error handling and fallbacks
- ✅ Good performance for 100+ concurrent users
