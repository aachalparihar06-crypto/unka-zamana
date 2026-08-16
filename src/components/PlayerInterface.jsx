import React from 'react';
import RetroTV from './RetroTV';
import SoundWaveEqualizer from './SoundWaveEqualizer';
import RotatingDedication from './RotatingDedication';

export default function PlayerInterface({
  currentSong,
  currentSongIndex = 0,
  totalSongs = 40,
  isPlaying,
  progress = 0,
  duration = 0,
  volume = 0.8,
  playerError,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onTogglePlaylist,
  videoSlot
}) {
  return (
    <div className="player-root">
      {/* Compact vintage TV console layout — lower center */}
      <footer className="player-tv-dock">
        {/* 1. Rotating Hindi dedication message above 'उनका ज़माना' */}
        <RotatingDedication />

        {/* 2. Noticeably enlarged subtle gray Hindi title */}
        <div className="hindi-title-badge" aria-label="उनका ज़माना">
          <span className="hindi-title-text">उनका ज़माना</span>
        </div>

        {/* 3. Existing TV Player Console */}
        <RetroTV
          currentSong={currentSong}
          currentSongIndex={currentSongIndex}
          totalSongs={totalSongs}
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          volume={volume}
          playerError={playerError}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onPrev={onPrev}
          onSeek={onSeek}
          onVolumeChange={onVolumeChange}
          onTogglePlaylist={onTogglePlaylist}
          videoSlot={videoSlot}
        />
      </footer>

      {/* 4. Golden animated sound wave visualizer spanning the FULL width of the interface edge-to-edge */}
      <SoundWaveEqualizer isPlaying={isPlaying} />
    </div>
  );
}
