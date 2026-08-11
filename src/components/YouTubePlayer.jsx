import React, { useEffect, useRef } from 'react';
import YouTube from 'react-youtube';

export default function YouTubePlayer({ videoId, onReady, onEnd, onError, onStateChange }) {
  const playerRef = useRef(null);

  const opts = {
    height: '112',
    width: '200',
    playerVars: {
      autoplay: 0, // We control playback via App.jsx
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  const handleReady = (event) => {
    playerRef.current = event.target;
    if (onReady) onReady(event);
  };

  // Force video change if react-youtube fails to do it, matching user request
  useEffect(() => {
    if (playerRef.current) {
      if (videoId) {
        playerRef.current.loadVideoById(videoId);
      } else {
        playerRef.current.stopVideo();
      }
    }
  }, [videoId]);

  return (
    <div className="youtube-player-container" style={{ borderRadius: '12px', overflow: 'hidden', margin: '1rem 0', pointerEvents: 'none', display: videoId ? 'block' : 'none' }}>
      <YouTube 
        videoId={videoId || ''} // NO DUMMY VIDEO!
        opts={opts} 
        onReady={handleReady} 
        onEnd={onEnd}
        onError={onError}
        onStateChange={onStateChange}
      />
    </div>
  );
}
