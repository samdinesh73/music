import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

// Room storage: roomId -> { host, users: [], currentVideoId, currentTime, isPlaying, messages }
const rooms = new Map();

// User storage: socketId -> { roomId, username, isHost }
const users = new Map();

/**
 * Create a new room
 */
app.post('/api/rooms/create', (req, res) => {
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  rooms.set(roomId, {
    host: null,
    users: [],
    currentVideoId: null,
    currentTime: 0,
    isPlaying: false,
    messages: [],
  });
  res.json({ roomId });
});

/**
 * Get room info
 */
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    roomId,
    userCount: room.users.length,
    host: room.host,
    currentVideoId: room.currentVideoId,
    currentTime: room.currentTime,
    isPlaying: room.isPlaying,
  });
});

/**
 * Socket.IO event handlers
 */
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  /**
   * User joins a room
   */
  socket.on('join-room', (data) => {
    const { roomId, username } = data;
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Add user to room
    socket.join(roomId);
    room.users.push(socket.id);
    users.set(socket.id, { roomId, username, isHost: false });

    // First user becomes host
    if (room.users.length === 1) {
      room.host = socket.id;
      users.get(socket.id).isHost = true;
      socket.emit('host-assigned');
    }

    // Send sync state to new joiner
    socket.emit('sync-state', {
      currentVideoId: room.currentVideoId,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      host: room.host,
      users: room.users.map(id => ({
        id,
        username: users.get(id)?.username || 'Unknown',
        isHost: users.get(id)?.isHost || false,
      })),
    });

    // Notify others about new user
    io.to(roomId).emit('user-joined', {
      userId: socket.id,
      username,
      userCount: room.users.length,
      users: room.users.map(id => ({
        id,
        username: users.get(id)?.username || 'Unknown',
        isHost: users.get(id)?.isHost || false,
      })),
    });

    console.log(`${username} joined room ${roomId}. Users: ${room.users.length}`);
  });

  /**
   * Host plays video
   */
  socket.on('play', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(user.roomId);
    if (!room || room.host !== socket.id) return;

    room.isPlaying = true;
    room.currentTime = data.currentTime || 0;

    io.to(user.roomId).emit('play', {
      currentTime: room.currentTime,
      timestamp: Date.now(),
    });
  });

  /**
   * Host pauses video
   */
  socket.on('pause', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(user.roomId);
    if (!room || room.host !== socket.id) return;

    room.isPlaying = false;
    room.currentTime = data.currentTime || 0;

    io.to(user.roomId).emit('pause', {
      currentTime: room.currentTime,
      timestamp: Date.now(),
    });
  });

  /**
   * Host seeks video
   */
  socket.on('seek', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(user.roomId);
    if (!room || room.host !== socket.id) return;

    room.currentTime = data.currentTime;

    io.to(user.roomId).emit('seek', {
      currentTime: room.currentTime,
      timestamp: Date.now(),
    });
  });

  /**
   * Host loads a new video
   */
  socket.on('load-video', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(user.roomId);
    if (!room || room.host !== socket.id) return;

    room.currentVideoId = data.videoId;
    room.currentTime = 0;
    room.isPlaying = false;

    io.to(user.roomId).emit('video-loaded', {
      videoId: data.videoId,
      currentTime: 0,
      isPlaying: false,
      timestamp: Date.now(),
    });
  });

  /**
   * Chat message
   */
  socket.on('send-message', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(user.roomId);
    if (!room) return;

    const message = {
      id: uuidv4(),
      userId: socket.id,
      username: user.username,
      text: data.text,
      timestamp: Date.now(),
    };

    room.messages.push(message);

    // Keep only last 50 messages
    if (room.messages.length > 50) {
      room.messages.shift();
    }

    io.to(user.roomId).emit('message', message);
  });

  /**
   * User disconnects
   */
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(user.roomId);
    if (!room) return;

    // Remove user from room
    room.users = room.users.filter(id => id !== socket.id);

    // If host disconnected, assign new host
    if (room.host === socket.id) {
      if (room.users.length > 0) {
        room.host = room.users[0];
        users.get(room.host).isHost = true;
        io.to(user.roomId).emit('host-changed', {
          newHostId: room.host,
          newHostUsername: users.get(room.host)?.username,
        });
      } else {
        room.host = null;
      }
    }

    // Delete room if empty
    if (room.users.length === 0) {
      rooms.delete(user.roomId);
      console.log(`Room ${user.roomId} deleted (empty)`);
    } else {
      io.to(user.roomId).emit('user-left', {
        userId: socket.id,
        username: user.username,
        userCount: room.users.length,
        users: room.users.map(id => ({
          id,
          username: users.get(id)?.username || 'Unknown',
          isHost: users.get(id)?.isHost || false,
        })),
      });
    }

    users.delete(socket.id);
    console.log(`User disconnected: ${socket.id}`);
  });
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🎵 Music Sync Server running on http://localhost:${PORT}\n`);
});
