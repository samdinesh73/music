import { useState } from 'react';
import { Play, LogOut } from 'lucide-react';

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

  const handleCreateRoom = () => {
    onCreateRoom();
  };

  if (mode === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 rounded-lg shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Join Room</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="e.g., ABC12DEF"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={isLoading || !roomId.trim() || !username.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </button>

            <button
              onClick={() => setMode('initial')}
              className="w-full text-gray-300 hover:text-white font-semibold py-2 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Play className="w-12 h-12 text-blue-500 mr-3" />
            <h1 className="text-4xl font-bold text-white">MusicSync</h1>
          </div>
          <p className="text-gray-400 text-lg">Watch videos together in real-time</p>
        </div>

        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 space-y-4">
          <button
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            <Play className="w-5 h-5 mr-2" />
            Create New Room
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-gray-400">or</span>
            </div>
          </div>

          <button
            onClick={() => setMode('join')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Join Existing Room
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Share the room ID with friends to sync videos together
        </p>
      </div>
    </div>
  );
};
