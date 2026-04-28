import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlayCircle, ArrowRight } from 'lucide-react';

interface RoomJoinProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string, username: string) => void;
  isLoading?: boolean;
}

export const RoomJoin: React.FC<RoomJoinProps> = ({
  onCreateRoom,
  onJoinRoom,
  isLoading = false,
}) => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'initial' | 'join'>('initial');

  const handleJoin = () => {
    if (roomId.trim() && username.trim()) {
      onJoinRoom(roomId.toUpperCase(), username);
    }
  };

  if (mode === 'join') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Join Room</h2>
            <p className="text-white/60">Enter room details to sync with friends</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Room ID
              </label>
              <Input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="e.g., ABC12DEF"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Your Name
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50"
              />
            </div>

            <Button
              onClick={handleJoin}
              disabled={isLoading || !roomId.trim() || !username.trim()}
              className="w-full bg-white text-black hover:bg-white/90 disabled:bg-white/50 font-semibold h-11 rounded-lg"
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </Button>

            <Button
              onClick={() => setMode('initial')}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 h-11"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/10 border border-white/20 rounded-full p-3">
              <PlayCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">MusicSync</h1>
          <p className="text-white/60 text-lg">Watch videos together in real-time</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8 space-y-4 backdrop-blur-xl">
          <Button
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-white/90 disabled:bg-white/50 font-semibold h-12 rounded-lg text-base"
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            Create New Room
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-white/60">or</span>
            </div>
          </div>

          <Button
            onClick={() => setMode('join')}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10 h-12 rounded-lg font-semibold text-base"
          >
            Join Existing Room
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <p className="text-center text-white/40 text-sm mt-8">
          Share the room ID with friends to sync videos together
        </p>
      </div>
    </div>
  );
};
