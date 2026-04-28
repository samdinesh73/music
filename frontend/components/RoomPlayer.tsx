import { useState, useEffect, useCallback } from 'react';
import { YouTubePlayer } from './YouTubePlayer';
import { Play, Pause, LogOut, Copy, MessageCircle, Send, Users } from 'lucide-react';

interface User {
  id: string;
  username: string;
  isHost: boolean;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

interface RoomPlayerProps {
  roomId: string;
  username: string;
  isHost: boolean;
  socket: any;
  onLeaveRoom: () => void;
}

export const RoomPlayer: React.FC<RoomPlayerProps> = ({
  roomId,
  username,
  isHost,
  socket,
  onLeaveRoom,
}) => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(true);

  // Extract video ID from URL
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Handle video load
  const handleLoadVideo = useCallback(() => {
    const id = extractVideoId(youtubeUrl);
    if (id && isHost && socket?.connected) {
      socket.emit('load-video', { videoId: id });
      setYoutubeUrl('');
    }
  }, [youtubeUrl, isHost, socket]);

  // Handle play
  const handlePlay = useCallback(() => {
    if (isHost && socket?.connected) {
      socket.emit('play', { currentTime });
    }
  }, [isHost, socket, currentTime]);

  // Handle pause
  const handlePause = useCallback(() => {
    if (isHost && socket?.connected) {
      socket.emit('pause', { currentTime });
    }
  }, [isHost, socket, currentTime]);

  // Handle seek
  const handleSeek = useCallback((time: number) => {
    if (isHost && socket?.connected) {
      socket.emit('seek', { currentTime: time });
    }
  }, [isHost, socket]);

  // Handle player state change
  const handlePlayerStateChange = useCallback((state: number) => {
    // 0 = ENDED, 1 = PLAYING, 2 = PAUSED, etc.
    if (isHost) {
      if (state === 1) {
        socket?.emit('play', { currentTime });
      } else if (state === 2) {
        socket?.emit('pause', { currentTime });
      }
    }
  }, [isHost, socket, currentTime]);

  // Send message
  const handleSendMessage = useCallback(() => {
    if (messageInput.trim() && socket?.connected) {
      socket.emit('send-message', { text: messageInput });
      setMessageInput('');
    }
  }, [messageInput, socket]);

  // Copy room ID
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Sync state
    socket.on('sync-state', (data: any) => {
      setVideoId(data.currentVideoId);
      setCurrentTime(data.currentTime);
      setIsPlaying(data.isPlaying);
      setUsers(data.users);
    });

    // Play event
    socket.on('play', (data: any) => {
      setCurrentTime(data.currentTime);
      setIsPlaying(true);
    });

    // Pause event
    socket.on('pause', (data: any) => {
      setCurrentTime(data.currentTime);
      setIsPlaying(false);
    });

    // Seek event
    socket.on('seek', (data: any) => {
      setCurrentTime(data.currentTime);
    });

    // Video loaded
    socket.on('video-loaded', (data: any) => {
      setVideoId(data.videoId);
      setCurrentTime(data.currentTime);
      setIsPlaying(data.isPlaying);
    });

    // User joined
    socket.on('user-joined', (data: any) => {
      setUsers(data.users);
    });

    // User left
    socket.on('user-left', (data: any) => {
      setUsers(data.users);
    });

    // Host changed
    socket.on('host-changed', (data: any) => {
      console.log(`New host: ${data.newHostUsername}`);
    });

    // Message
    socket.on('message', (data: any) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off('sync-state');
      socket.off('play');
      socket.off('pause');
      socket.off('seek');
      socket.off('video-loaded');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('host-changed');
      socket.off('message');
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">MusicSync</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-400">Room: {roomId}</span>
              <button
                onClick={handleCopyRoomId}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-gray-300 px-2 py-1 rounded transition-colors"
              >
                {copied ? '✓ Copied' : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Leave
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video player */}
            <div className="bg-slate-800 rounded-lg p-4">
              <YouTubePlayer
                videoId={videoId}
                isPlaying={isPlaying}
                currentTime={currentTime}
                onTimeUpdate={setCurrentTime}
                onStateChange={handlePlayerStateChange}
                isHost={isHost}
              />
            </div>

            {/* Controls */}
            <div className="bg-slate-800 rounded-lg p-4 space-y-4">
              {isHost ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Load YouTube Video
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="Paste YouTube URL here"
                        onKeyPress={(e) => e.key === 'Enter' && handleLoadVideo()}
                        className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleLoadVideo}
                        disabled={!youtubeUrl.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Load
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={isPlaying ? handlePause : handlePlay}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-5 h-5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Play
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={Math.min(currentTime * 10, 1000)}
                      onChange={(e) => handleSeek(e.target.valueAsNumber / 10)}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-400 w-16">
                      {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2 bg-blue-600/20 border border-blue-500/50 rounded-lg p-3 text-blue-400 text-sm">
                    👑 You are the Host
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 bg-slate-700 rounded-lg p-3 text-gray-400 text-sm">
                  Waiting for host to control playback...
                </div>
              )}
            </div>

            {/* Status */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-gray-400">
                Status: <span className="text-white font-semibold">{isPlaying ? '▶ Playing' : '⏸ Paused'}</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Users */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-400" />
                <h2 className="font-semibold text-white">Users ({users.length})</h2>
              </div>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 p-2 bg-slate-700 rounded text-sm text-gray-300"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{user.username}</span>
                    {user.isHost && <span className="text-xs bg-blue-600 px-2 py-1 rounded ml-auto">Host</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="bg-slate-800 rounded-lg p-4 flex flex-col h-96">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-400" />
                  <h2 className="font-semibold text-white">Chat</h2>
                </div>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  {showChat ? '−' : '+'}
                </button>
              </div>

              {showChat && (
                <>
                  <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-2">
                    {messages.map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <span className="text-blue-400 font-medium">{msg.username}</span>
                        <span className="text-gray-400">: </span>
                        <span className="text-gray-300">{msg.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type message..."
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
