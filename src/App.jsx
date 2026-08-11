import React, { useState, useEffect, useRef } from 'react';
import OpeningScreen from './components/OpeningScreen';
import BackgroundView from './components/BackgroundView';
import PlayerInterface from './components/PlayerInterface';
import PlaylistDrawer from './components/PlaylistDrawer';
import { songs } from './data/songs';

function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  
  const [ytPlayer, setYtPlayer] = useState(null);
  const [ytError, setYtError] = useState(null);
  const progressInterval = useRef(null);

  const currentSong = songs[currentSongIndex];

  // Sync volume with youtube player when it changes
  useEffect(() => {
    if (ytPlayer) {
      ytPlayer.setVolume(volume * 100);
    }
  }, [volume, ytPlayer]);

  // Handle Progress tracking
  useEffect(() => {
    if (isPlaying && ytPlayer) {
      progressInterval.current = setInterval(async () => {
        try {
          const currentTime = await ytPlayer.getCurrentTime();
          setProgress(currentTime);
        } catch (e) {
          // ignore error if player isn't fully ready
        }
      }, 1000);
    } else {
      clearInterval(progressInterval.current);
    }
    return () => clearInterval(progressInterval.current);
  }, [isPlaying, ytPlayer]);

  // When song changes, clear errors
  useEffect(() => {
    setYtError(null);
    setProgress(0);
    setDuration(0);
  }, [currentSongIndex]);

  const handleYtReady = (event) => {
    const player = event.target;
    setYtPlayer(player);
    player.setVolume(volume * 100);
    
    // Automatically get duration when ready
    player.getDuration().then((d) => setDuration(d)).catch(() => {});
  };

  const handleYtStateChange = (event) => {
    // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
    if (event.data === 1) {
      setIsPlaying(true);
      event.target.getDuration().then((d) => setDuration(d)).catch(() => {});
    } else if (event.data === 2) {
      setIsPlaying(false);
    } else if (event.data === 0) {
      setIsPlaying(false);
      handleNext();
    }
  };

  const handleYtError = (event) => {
    console.error("YouTube Player Error:", event.data);
    setYtError(event.data);
    setIsPlaying(false);
  };

  const handleYtEnd = () => {
    handleNext();
  };

  const handlePlayPause = () => {
    if (!currentSong.youtubeId || ytError) return;
    if (isPlaying) {
      ytPlayer?.pauseVideo();
    } else {
      ytPlayer?.playVideo();
    }
  };

  const handleNext = () => {
    setCurrentSongIndex((prev) => (prev + 1) % songs.length);
  };

  const handlePrev = () => {
    if (progress > 5 && ytPlayer) {
      ytPlayer.seekTo(0);
      setProgress(0);
    } else {
      setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
    }
  };

  const handleSeek = (newTime) => {
    if (ytPlayer) {
      ytPlayer.seekTo(newTime, true);
      setProgress(newTime);
    }
  };

  // Explicitly load video when song changes to prevent stale playback
  useEffect(() => {
    if (ytPlayer) {
      if (currentSong.youtubeId) {
        ytPlayer.loadVideoById(currentSong.youtubeId);
        if (isPlaying) {
          ytPlayer.playVideo();
        }
      } else {
        ytPlayer.stopVideo();
        setIsPlaying(false);
      }
    }
  }, [currentSong.youtubeId, ytPlayer]);

  const handleSelectSong = (index) => {
    setCurrentSongIndex(index);
    setIsPlaying(true); // Auto play if we pick a song
    if (window.innerWidth <= 768) {
      setIsPlaylistOpen(false); // Close drawer on mobile after picking
    }
  };

  return (
    <div className="app-container">
      {/* Debug display as requested */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 9999, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '15px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
        <div>CURRENT SONG</div>
        <div style={{ color: 'var(--color-gold)' }}>Title: {currentSong?.title}</div>
        <br />
        <div>YOUTUBE ID:</div>
        <div style={{ color: 'var(--color-gold)' }}>{currentSong?.youtubeId || 'NONE'}</div>
        <br />
        <div>SOURCE:</div>
        <div style={{ color: 'var(--color-gold)' }}>YouTube IFrame Player</div>
      </div>

      {!hasEntered ? (
        <OpeningScreen onEnter={() => setHasEntered(true)} />
      ) : (
        <>
          <BackgroundView currentGroup={currentSong.backgroundGroup} />
          
          <PlayerInterface 
            currentSong={currentSong}
            isPlaying={isPlaying}
            progress={progress}
            duration={duration}
            volume={volume}
            ytError={ytError}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrev={handlePrev}
            onSeek={handleSeek}
            onVolumeChange={setVolume}
            onTogglePlaylist={() => setIsPlaylistOpen(!isPlaylistOpen)}
            onYtReady={handleYtReady}
            onYtEnd={handleYtEnd}
            onYtError={handleYtError}
            onYtStateChange={handleYtStateChange}
          />

          <PlaylistDrawer 
            isOpen={isPlaylistOpen} 
            onClose={() => setIsPlaylistOpen(false)}
            songs={songs}
            currentIndex={currentSongIndex}
            onSelectSong={handleSelectSong}
          />
        </>
      )}
    </div>
  );
}

export default App;
