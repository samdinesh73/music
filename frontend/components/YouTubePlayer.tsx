import { useEffect, useRef, useState, useCallback } from 'react';

interface YouTubePlayerProps {
  videoId: string | null;
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onStateChange: (state: number) => void;
  isHost: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onStateChange,
  isHost,
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const isSyncingRef = useRef(false);

  // Load YouTube API
  useEffect(() => {
    if (window.YT) {
      setIsReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsReady(true);
    };
  }, []);

  // Initialize player
  useEffect(() => {
    if (!isReady || !containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player('youtube-player', {
      width: '100%',
      height: '100%',
      videoId: videoId || '',
      events: {
        onReady: (event: any) => {
          console.log('Player ready');
        },
        onStateChange: (event: any) => {
          onStateChange(event.data);
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data);
        },
      },
    });
  }, [isReady, videoId, onStateChange]);

  // Load new video
  useEffect(() => {
    if (!playerRef.current || !videoId || !isReady) return;
    
    // Check if loadVideoById method exists before calling
    if (typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId, isReady]);

  // Sync playback
  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    isSyncingRef.current = true;

    // Check if player methods exist before calling
    if (typeof playerRef.current.playVideo === 'function') {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else if (typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    }

    // Seek if time difference is > 1 second
    if (typeof playerRef.current.getCurrentTime === 'function') {
      const playerTime = playerRef.current.getCurrentTime() || 0;
      if (Math.abs(playerTime - currentTime) > 1 && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(currentTime);
      }
    }

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 500);
  }, [isPlaying, currentTime, isReady]);

  // Track playback for host
  useEffect(() => {
    if (!isHost || !playerRef.current) return;

    const interval = setInterval(() => {
      if (typeof playerRef.current?.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime() || 0;
        if (time > 0) {
          onTimeUpdate(time);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, onTimeUpdate]);

  return (
    <div ref={containerRef} className="w-full bg-black rounded-lg overflow-hidden aspect-video">
      <div id="youtube-player" className="w-full h-full" />
    </div>
  );
};
