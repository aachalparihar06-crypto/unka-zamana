import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const YouTubePlayer = forwardRef(function YouTubePlayer(
  {
    isPlaying,
    volume = 0.8,
    currentIndex,
    currentVideoId,
    onStateChange,
    onPlayerReady,
    onError,
    onTrackChange,
    playerRef,
  },
  _ref
) {
  const containerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const isReadyRef = useRef(false);
  const lastTrackIndexRef = useRef(-1);

  // ── Imperative API exposed to parent via playerRef prop ─────────────────────
  useImperativeHandle(playerRef, () => {
    return {
      playVideo() {
        if (ytPlayerRef.current && isReadyRef.current) {
          try {
            ytPlayerRef.current.playVideo();
          } catch (e) {
            console.error('[YT Player] playVideo error:', e);
          }
        }
      },
      pauseVideo() {
        if (ytPlayerRef.current && isReadyRef.current) {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (e) {
            console.error('[YT Player] pauseVideo error:', e);
          }
        }
      },
      seekTo(seconds) {
        if (ytPlayerRef.current && isReadyRef.current) {
          try {
            ytPlayerRef.current.seekTo(seconds, true);
          } catch (_) {}
        }
      },
      nextVideo() {
        if (ytPlayerRef.current && isReadyRef.current) {
          try {
            ytPlayerRef.current.nextVideo();
          } catch (_) {}
        }
      },
      previousVideo() {
        if (ytPlayerRef.current && isReadyRef.current) {
          try {
            ytPlayerRef.current.previousVideo();
          } catch (_) {}
        }
      },
      loadVideoById(videoId) {
        if (ytPlayerRef.current && isReadyRef.current && videoId) {
          try {
            ytPlayerRef.current.loadVideoById(videoId);
          } catch (e) {
            console.error('[YT Player] loadVideoById error:', e);
          }
        }
      },
      playVideoAt(index) {
        if (ytPlayerRef.current && isReadyRef.current) {
          try {
            ytPlayerRef.current.playVideoAt(index);
          } catch (_) {}
        }
      },
      setVolume(vol) {
        if (ytPlayerRef.current && isReadyRef.current) {
          try {
            ytPlayerRef.current.setVolume(Math.round(vol * 100));
          } catch (_) {}
        }
      },
      getCurrentTime() {
        if (ytPlayerRef.current && isReadyRef.current && ytPlayerRef.current.getCurrentTime) {
          return ytPlayerRef.current.getCurrentTime();
        }
        return 0;
      },
      getDuration() {
        if (ytPlayerRef.current && isReadyRef.current && ytPlayerRef.current.getDuration) {
          return ytPlayerRef.current.getDuration();
        }
        return 0;
      },
      getPlaylistIndex() {
        if (ytPlayerRef.current && isReadyRef.current && ytPlayerRef.current.getPlaylistIndex) {
          return ytPlayerRef.current.getPlaylistIndex();
        }
        return -1;
      },
    };
  });

  // ── Initialize YouTube IFrame API & create player ──────────────────────────
  useEffect(() => {
    let pollInterval = null;

    const createPlayer = () => {
      if (!containerRef.current) return;
      if (ytPlayerRef.current) return;

      const initialId = currentVideoId || 'lNW8qsoeWs4';

      try {
        const player = new window.YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId: initialId,
          playerVars: {
            autoplay: 0,
            controls: 0, // Hide YouTube native controls
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              isReadyRef.current = true;
              ytPlayerRef.current = event.target;

              const vol = Math.round(volume * 100);
              try { event.target.setVolume(vol); } catch (e) {}

              if (onPlayerReady) onPlayerReady(event.target);
            },
            onStateChange: (event) => {
              handleStateChange(event);
            },
            onError: (event) => {
              const code = event.data;
              let msg = 'Video unavailable or restricted.';
              if (code === 2) msg = 'Invalid video parameter.';
              if (code === 5) msg = 'HTML5 player error.';
              if (code === 100) msg = 'Video not found or removed.';
              if (code === 101 || code === 150) msg = 'Embedding disabled by owner.';
              if (onError) onError(msg, code);
            },
          },
        });

        ytPlayerRef.current = player;
      } catch (err) {
        console.error('[YT Player] constructor threw:', err);
        if (onError) onError('Failed to construct YouTube player.', err);
      }
    };

    const initYT = () => {
      if (window.YT && window.YT.Player && !ytPlayerRef.current) {
        createPlayer();
      }
    };

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      const prevCb = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCb) prevCb();
        initYT();
      };

      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      pollInterval = setInterval(() => {
        if (window.YT && window.YT.Player && !ytPlayerRef.current) {
          clearInterval(pollInterval);
          initYT();
        }
      }, 300);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStateChange = (event) => {
    const player = event.target;
    if (!player) return;

    const state = event.data;
    const curIndex = player.getPlaylistIndex ? player.getPlaylistIndex() : -1;
    const videoData = player.getVideoData ? player.getVideoData() : null;
    const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
    const duration = player.getDuration ? player.getDuration() : 0;

    if (curIndex !== -1 && curIndex !== lastTrackIndexRef.current) {
      lastTrackIndexRef.current = curIndex;
      if (onTrackChange) onTrackChange(curIndex, videoData);
    }

    if (onStateChange) {
      onStateChange({
        playerState: state,
        currentTime: currentTime || 0,
        duration: duration || 0,
        playlistIndex: curIndex,
        videoData,
      });
    }
  };

  // ── Sync isPlaying prop → player ───────────────────────────────────────────
  useEffect(() => {
    if (!ytPlayerRef.current || !isReadyRef.current || !window.YT) return;
    try {
      const state = ytPlayerRef.current.getPlayerState ? ytPlayerRef.current.getPlayerState() : -1;
      if (isPlaying && state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING) {
        ytPlayerRef.current.playVideo();
      } else if (!isPlaying && state === window.YT.PlayerState.PLAYING) {
        ytPlayerRef.current.pauseVideo();
      }
    } catch (e) {}
  }, [isPlaying]);

  // ── Sync volume prop → player ──────────────────────────────────────────────
  useEffect(() => {
    if (!ytPlayerRef.current || !isReadyRef.current) return;
    try { ytPlayerRef.current.setVolume(Math.round(volume * 100)); } catch (_) {}
  }, [volume]);

  // Rendered inside the CRT screen — YouTube video is visible.
  // YouTube native controls are hidden (controls:0); our custom UI drives playback.
  return (
    <div className="youtube-player-frame">
      <div ref={containerRef} id="yt-player-target" className="youtube-iframe-holder" />
    </div>
  );
});

export default YouTubePlayer;
