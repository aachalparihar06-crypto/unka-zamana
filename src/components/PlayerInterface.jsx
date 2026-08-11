import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ListMusic, ExternalLink } from 'lucide-react';
import YouTubePlayer from './YouTubePlayer';

export default function PlayerInterface({
  currentSong,
  isPlaying,
  progress,
  duration,
  volume,
  ytError,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onTogglePlaylist,
  onYtReady,
  onYtEnd,
  onYtError,
  onYtStateChange
}) {
  const formatTime = (time) => {
    if (isNaN(time) || time < 0) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const lyricsLines = currentSong.lyrics ? currentSong.lyrics.split('\n') : ["Lyrics will be added soon."];

  const getErrorMessage = (code) => {
    if (code === 2) return "Invalid video ID.";
    if (code === 5) return "HTML5 player error.";
    if (code === 100) return "Video not found or private.";
    if (code === 101 || code === 150) return "This specific YouTube video cannot be embedded.";
    return "This song cannot be played here.";
  };

  return (
    <div className="player-interface">
      {/* Left - Lyrics */}
      <div className="lyrics-panel glass-panel">
        {lyricsLines.map((line, idx) => (
          <div key={idx} className={`lyric-line ${idx === 0 ? 'active' : ''}`}>
            {line}
          </div>
        ))}
      </div>

      {/* Center - Info */}
      <div className="center-display">
        <div className="song-info-card glass-panel">
          <h2 className="song-title">{currentSong.title}</h2>
          <div className="song-singer">{currentSong.singer}</div>
          <div className="song-movie">{currentSong.movie} • {currentSong.year}</div>

          {ytError !== null && currentSong.youtubeId ? (
            <div style={{ marginTop: '1rem', color: '#ffaaaa', fontSize: '0.9rem', fontStyle: 'italic' }}>
              {getErrorMessage(ytError)}
            </div>
          ) : !currentSong.youtubeId ? (
            <div style={{ marginTop: '1rem', opacity: 0.6, fontSize: '0.9rem', fontStyle: 'italic' }}>
              YouTube source not configured for this song.
            </div>
          ) : null}

          {/* ALWAYS render YouTubePlayer to maintain iframe state */}
          <YouTubePlayer 
            videoId={currentSong.youtubeId}
            onReady={onYtReady}
            onEnd={onYtEnd}
            onError={onYtError}
            onStateChange={onYtStateChange}
          />
        </div>
      </div>

      {/* Right - Volume & Playlist */}
      <div className="right-panel">
        <button className="glass-button" onClick={onTogglePlaylist} style={{ padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ListMusic size={20} />
          Playlist
        </button>
        <div className="volume-control glass-panel">
          <Volume2 size={20} opacity={0.7} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="volume-slider"
          />
        </div>
      </div>

      {/* Bottom - Controls */}
      <div className="bottom-controls glass-panel">
        <div className="progress-container">
          <span>{formatTime(progress)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={progress}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="progress-bar"
          />
          <span>{formatTime(duration)}</span>
        </div>
        
        <div className="control-buttons">
          <button className="btn-icon" onClick={onPrev}>
            <SkipBack size={24} />
          </button>
          <button className="btn-icon btn-play" onClick={onPlayPause} disabled={!currentSong.youtubeId || ytError}>
            {isPlaying ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
          </button>
          <button className="btn-icon" onClick={onNext}>
            <SkipForward size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
