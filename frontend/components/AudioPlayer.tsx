import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioPlayerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onStateChange: (state: number) => void;
  onDurationChange: (duration: number) => void;
  isHost: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onStateChange,
  onDurationChange,
  isHost,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isReady, setIsReady] = useState(false);
  const isSyncingRef = useRef(false);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) return;
    setIsReady(true);
  }, []);

  // Load new audio
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    audioRef.current.src = audioUrl;
    audioRef.current.load();
  }, [audioUrl]);

  // Sync playback
  useEffect(() => {
    if (!audioRef.current || !isReady) return;

    isSyncingRef.current = true;

    if (isPlaying) {
      audioRef.current.play().catch((err) => console.error('Play error:', err));
    } else {
      audioRef.current.pause();
    }

    // Seek if time difference is > 1 second
    const audioTime = audioRef.current.currentTime || 0;
    if (Math.abs(audioTime - currentTime) > 1) {
      audioRef.current.currentTime = currentTime;
    }

    isSyncingRef.current = false;
  }, [isPlaying, currentTime, isReady]);

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (!isSyncingRef.current && audioRef.current) {
      onTimeUpdate(audioRef.current.currentTime);
    }
  }, [onTimeUpdate]);

  // Handle play/pause
  const handlePlay = useCallback(() => {
    if (isHost && !isSyncingRef.current) {
      onStateChange(1); // 1 = playing
    }
  }, [isHost, onStateChange]);

  const handlePause = useCallback(() => {
    if (isHost && !isSyncingRef.current) {
      onStateChange(2); // 2 = paused
    }
  }, [isHost, onStateChange]);

  // Handle duration change
  const handleDurationChange = useCallback(() => {
    if (audioRef.current && audioRef.current.duration) {
      onDurationChange(audioRef.current.duration);
    }
  }, [onDurationChange]);

  return (
    <div className="w-full">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onDurationChange={handleDurationChange}
        onEnded={() => onStateChange(0)}
        crossOrigin="anonymous"
      />
      <div className="bg-gradient-to-br from-black/20 to-black/10 border border-black/20 rounded-lg p-4">
        <div className="text-center text-black/60 text-sm">
          🎵 Now playing local audio
        </div>
      </div>
    </div>
  );
};
