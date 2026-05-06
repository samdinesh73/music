import { useState, useEffect, useCallback } from 'react';
import { YouTubePlayer } from './YouTubePlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, LogOut, Copy, Send, Users, MessageCircle, Crown } from 'lucide-react';

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

    socket.on('sync-state', (data: any) => {
      setVideoId(data.currentVideoId);
      setCurrentTime(data.currentTime);
      setIsPlaying(data.isPlaying);
      setUsers(data.users);
    });

    socket.on('play', (data: any) => {
      setCurrentTime(data.currentTime);
      setIsPlaying(true);
    });

    socket.on('pause', (data: any) => {
      setCurrentTime(data.currentTime);
      setIsPlaying(false);
    });

    socket.on('seek', (data: any) => {
      setCurrentTime(data.currentTime);
    });

    socket.on('video-loaded', (data: any) => {
      setVideoId(data.videoId);
      setCurrentTime(data.currentTime);
      setIsPlaying(data.isPlaying);
    });

    socket.on('user-joined', (data: any) => {
      setUsers(data.users);
    });

    socket.on('user-left', (data: any) => {
      setUsers(data.users);
    });

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
      socket.off('message');
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black">MusicSync</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-black/60">Room: </span>
              <span className="font-mono text-lg font-semibold text-black">{roomId}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyRoomId}
                className="border-black/20 text-black hover:bg-black/10 h-8 px-2"
              >
                {copied ? '✓ Copied' : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>
          <Button
            onClick={onLeaveRoom}
            className="bg-red-600 hover:bg-red-700 text-white h-10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="bg-black border-white/20 p-0 overflow-hidden">
              <YouTubePlayer
                videoId={videoId}
                isPlaying={isPlaying}
                currentTime={currentTime}
                onTimeUpdate={setCurrentTime}
                onStateChange={handlePlayerStateChange}
                isHost={isHost}
              />
            </Card>

            {/* Controls */}
            <Card className="bg-black/5 border-black/10 p-6">
              {isHost ? (
                <div className="space-y-6">
                  {/* Load Video */}
                  <div>
                    <label className="block text-sm font-semibold text-black mb-3">
                      Load YouTube Video
                    </label>
                    <div className="flex gap-3">
                      <Input
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="Paste YouTube URL"
                        onKeyPress={(e) => e.key === 'Enter' && handleLoadVideo()}
                        className="bg-black/5 border-black/20 text-black placeholder:text-black/40"
                      />
                      <Button
                        onClick={handleLoadVideo}
                        disabled={!youtubeUrl.trim()}
                        className="bg-black text-white hover:bg-black/90 disabled:bg-black/50 px-6"
                      >
                        Load
                      </Button>
                    </div>
                  </div>

                  {/* Play/Pause */}
                  <div>
                    <Button
                      onClick={isPlaying ? handlePause : handlePlay}
                      className="w-full bg-black text-white hover:bg-black/90 h-11 font-semibold text-base"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-5 h-5 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Play
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Seek Bar */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[currentTime]}
                        onValueChange={(value) => handleSeek(value[0])}
                        max={1000}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm text-black/60 font-mono w-12">
                        {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Host Badge */}
                  <Badge className="bg-black text-white w-fit px-4 py-2">
                    <Crown className="w-3 h-3 mr-2" />
                    You are the Host
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 p-6 bg-black/5 border border-black/10 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-black/70 text-sm font-medium">
                    Waiting for host to control playback...
                  </span>
                </div>
              )}
            </Card>

            {/* Status */}
            <Card className="bg-black/5 border-black/10 p-4">
              <div className="text-sm">
                <span className="text-black/60">Status: </span>
                <Badge variant="outline" className="border-black/20 text-black ml-2">
                  {isPlaying ? '▶ Playing' : '⏸ Paused'}
                </Badge>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Users */}
            <Card className="bg-black/5 border-black/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-black" />
                <h2 className="font-semibold text-black text-lg">Users</h2>
                <Badge className="bg-black text-white ml-auto">{users.length}</Badge>
              </div>
              <Separator className="bg-black/10 mb-4" />
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 bg-black/5 border border-black/10 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-black flex-1">{user.username}</span>
                    {user.isHost && (
                      <Badge className="bg-black text-white text-xs h-6">
                        <Crown className="w-3 h-3 mr-1" />
                        Host
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Chat */}
            <Card className="bg-black/5 border-black/10 p-6 flex flex-col h-96">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-black" />
                  <h2 className="font-semibold text-black text-lg">Chat</h2>
                </div>
              </div>
              <Separator className="bg-black/10 mb-4" />

              <ScrollArea className="flex-1 mb-4 pr-4">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-black/40 text-sm py-8">No messages yet</p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <span className="text-black font-medium">{msg.username}</span>
                        <span className="text-black/60">: </span>
                        <span className="text-black/80">{msg.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2 mt-auto">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type message..."
                  className="bg-black/5 border-black/20 text-black placeholder:text-black/40 h-10"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-black text-white hover:bg-black/90 px-4 h-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
