import React, { useState, useEffect, useRef } from 'react';
import OpeningScreen from './components/OpeningScreen';
import BackgroundView from './components/BackgroundView';
import PlayerInterface from './components/PlayerInterface';
import PlaylistDrawer from './components/PlaylistDrawer';
import YouTubePlayer from './components/YouTubePlayer';
import { songs } from './data/songs';

function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  const ytPlayerRef = useRef(null);
  const currentSong = songs[currentSongIndex] || songs[0];

  // Poll progress while playing
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        if (ytPlayerRef.current?.getCurrentTime) {
          const curTime = ytPlayerRef.current.getCurrentTime();
          const durTime = ytPlayerRef.current.getDuration();
          if (curTime > 0) setProgress(curTime);
          if (durTime > 0) setDuration(durTime);
        }
      }, 500);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying]);

  const handlePlayPause = () => {
    setPlayerError(null);
    const next = !isPlaying;
    setIsPlaying(next);
    if (next) {
      ytPlayerRef.current?.playVideo?.();
    } else {
      ytPlayerRef.current?.pauseVideo?.();
    }
  };

  const handleNext = () => {
    setPlayerError(null);
    const nextIndex = (currentSongIndex + 1) % songs.length;
    setCurrentSongIndex(nextIndex);
    setProgress(0);
    setIsPlaying(true);
    ytPlayerRef.current?.loadVideoById(songs[nextIndex].youtubeId);
  };

  const handlePrev = () => {
    setPlayerError(null);
    if (progress > 5) {
      ytPlayerRef.current?.seekTo(0);
      setProgress(0);
    } else {
      const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
      setCurrentSongIndex(prevIndex);
      setProgress(0);
      setIsPlaying(true);
      ytPlayerRef.current?.loadVideoById(songs[prevIndex].youtubeId);
    }
  };

  const handleSeek = (newTime) => {
    setProgress(newTime);
    ytPlayerRef.current?.seekTo(newTime);
  };

  const handleSelectSong = (index) => {
    setPlayerError(null);
    setCurrentSongIndex(index);
    setProgress(0);
    setIsPlaying(true);
    ytPlayerRef.current?.loadVideoById(songs[index].youtubeId);
    if (window.innerWidth <= 768) setIsPlaylistOpen(false);
  };

  const handleYTStateChange = ({ playerState, currentTime, duration: dur }) => {
    if (currentTime > 0) setProgress(currentTime);
    if (dur > 0) setDuration(dur);
    if (window.YT) {
      if (playerState === window.YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        setPlayerError(null);
      } else if (playerState === window.YT.PlayerState.PAUSED) {
        setIsPlaying(false);
      } else if (playerState === window.YT.PlayerState.ENDED) {
        handleNext();
      }
    }
  };

  const handlePlayerReady = () => setPlayerError(null);
  const handlePlayerError = (msg) => setPlayerError(msg);

  return (
    <div className="app-root">
      {/* Thin wooden page frame */}
      <div className="page-frame" aria-hidden="true" />

      <BackgroundView currentSongIndex={currentSongIndex} />

      <PlayerInterface
        currentSong={currentSong}
        currentSongIndex={currentSongIndex}
        totalSongs={songs.length}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        volume={volume}
        playerError={playerError}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onVolumeChange={setVolume}
        onTogglePlaylist={() => setIsPlaylistOpen(p => !p)}
        videoSlot={
          <YouTubePlayer
            isPlaying={isPlaying}
            volume={volume}
            currentIndex={currentSongIndex}
            currentVideoId={currentSong.youtubeId}
            onStateChange={handleYTStateChange}
            onTrackChange={() => {}}
            onPlayerReady={handlePlayerReady}
            onError={handlePlayerError}
            playerRef={ytPlayerRef}
          />
        }
      />

      <PlaylistDrawer
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        songs={songs}
        currentIndex={currentSongIndex}
        onSelectSong={handleSelectSong}
      />

      {!hasEntered && (
        <OpeningScreen onEnter={() => setHasEntered(true)} />
      )}
    </div>
  );
}

export default App;
