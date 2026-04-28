'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '@/lib/useSocket';
import { RoomJoin } from '@/components/RoomJoin';
import { RoomPlayer } from '@/components/RoomPlayer';

interface RoomState {
  roomId: string | null;
  username: string | null;
  isHost: boolean;
}

export default function Home() {
  const { socket, isConnected, emit } = useSocket();
  const [roomState, setRoomState] = useState<RoomState>({
    roomId: null,
    username: null,
    isHost: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCreateRoom = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      const response = await fetch(`${socketUrl}/api/rooms/create`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to create room');

      const data = await response.json();
      const roomId = data.roomId;

      // Join the room with a default username
      setRoomState({
        roomId,
        username: 'Host',
        isHost: true,
      });

      // Emit join event after socket is ready
      setTimeout(() => {
        emit('join-room', {
          roomId,
          username: 'Host',
        });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  }, [emit]);

  const handleJoinRoom = useCallback(
    (roomId: string, username: string) => {
      setIsLoading(true);
      setError(null);

      try {
        setRoomState({
          roomId,
          username,
          isHost: false,
        });

        // Emit join event
        emit('join-room', {
          roomId,
          username,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join room');
        setIsLoading(false);
      }
    },
    [emit]
  );

  const handleLeaveRoom = useCallback(() => {
    setRoomState({
      roomId: null,
      username: null,
      isHost: false,
    });
  }, []);

  // Listen for host assignment
  useEffect(() => {
    if (!socket) return;

    socket.on('host-assigned', () => {
      setRoomState((prev) => ({ ...prev, isHost: true }));
      setIsLoading(false);
    });

    socket.on('error', (data: any) => {
      setError(data.message || 'An error occurred');
      setIsLoading(false);
    });

    return () => {
      socket.off('host-assigned');
      socket.off('error');
    };
  }, [socket]);

  // Stop loading after a delay if not set to host
  useEffect(() => {
    if (isLoading && !roomState.isHost) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, roomState.isHost]);

  // Prevent hydration mismatch - don't render until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (roomState.roomId && roomState.username && socket) {
    return (
      <RoomPlayer
        roomId={roomState.roomId}
        username={roomState.username}
        isHost={roomState.isHost}
        socket={socket}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  return (
    <RoomJoin
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      isLoading={isLoading}
    />
  );
}
     
