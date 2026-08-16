import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, ListMusic, Heart } from 'lucide-react';

export default function RetroTV({
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
  videoSlot   // ← the visible YouTube iframe rendered here
}) {
  const [isFavorite, setIsFavorite] = useState(false);

  const formatTime = (time) => {
    if (!time || isNaN(time) || time < 0) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const trackNum = String(currentSongIndex + 1).padStart(2, '0');
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="retro-tv-wrap">

      {/* ── VINTAGE WALNUT CONSOLE BODY ── */}
      <div className="retro-console">

        {/* Corner brass rivets */}
        <span className="rivet r-tl" />
        <span className="rivet r-tr" />
        <span className="rivet r-bl" />
        <span className="rivet r-br" />

        {/* Top decorative ridge */}
        <div className="console-top-ridge">
          <span className="brand-plate">UNKA ZAMANA</span>
          <span className="model-plate">HI-FI DELUXE • 1978</span>
        </div>

        {/* Inner console panel: Left = CRT screen  |  Right = Controls */}
        <div className="console-body">

          {/* ── LEFT: CRT screen with live YouTube video ── */}
          <div className="crt-panel">
            <div className="crt-screen">
              {/* Live YouTube video */}
              <div className="crt-video-wrap">
                {videoSlot}
              </div>
              {/* CRT overlay effects (pointer-events:none so clicks reach iframe) */}
              <div className="crt-scan" />
              <div className="crt-vignette" />
              <div className="crt-glass-sheen" />
              <div className={`crt-phosphor-glow ${isPlaying ? 'active' : ''}`} />
            </div>
            {/* Pilot LED + brand text below screen */}
            <div className="crt-footer">
              <div className={`pilot-led ${isPlaying ? 'led-on' : ''}`} />
              <span className="crt-footer-text">DOORDARSHAN READY</span>
            </div>
          </div>

          {/* ── RIGHT: All playback controls ── */}
          <div className="ctrl-panel">

            {/* NOW PLAYING header */}
            <div className="now-playing-header">
              <div className="np-dot-row">
                <span className={`np-dot ${isPlaying ? 'np-dot-on' : ''}`} />
                <span className="np-label">NOW PLAYING</span>
              </div>
              <span className="track-counter">TRACK {trackNum} / {totalSongs}</span>
            </div>

            {/* Song metadata */}
            <div className="song-meta">
              <h2 className="song-title-text" title={currentSong?.title}>
                {currentSong?.title || 'Yeh Kahan Aa Gaye Hum'}
              </h2>
              <div className="song-sub-line">
                <span className="song-singer">{currentSong?.singer || 'Lata Mangeshkar'}</span>
                {currentSong?.movie && (
                  <span className="song-movie"> • {currentSong.movie} ({currentSong.year})</span>
                )}
              </div>
            </div>

            {/* Progress timeline */}
            <div className="timeline-section">
              <span className="time-tag">{formatTime(progress)}</span>
              <div
                className="timeline-track"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  onSeek(ratio * duration);
                }}
              >
                <div className="timeline-fill" style={{ width: `${progressPct}%` }} />
                <div className="timeline-thumb" style={{ left: `${progressPct}%` }} />
              </div>
              <span className="time-tag">{formatTime(duration)}</span>
            </div>

            {/* Accessible range input (sr-only) */}
            <input
              type="range"
              className="sr-seek-input"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              aria-label="Seek playback"
            />

            {/* Playback buttons */}
            <div className="playback-btns">
              <button className="ctrl-btn prev-btn" onClick={onPrev} title="Previous">
                <SkipBack size={18} />
              </button>

              <button
                className={`ctrl-btn play-btn ${isPlaying ? 'playing' : ''}`}
                onClick={onPlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}
              </button>

              <button className="ctrl-btn next-btn" onClick={onNext} title="Next">
                <SkipForward size={18} />
              </button>

              <button
                className={`ctrl-btn fav-btn ${isFavorite ? 'fav-active' : ''}`}
                onClick={() => setIsFavorite(f => !f)}
                title="Favourite"
              >
                <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Volume + Playlist row */}
            <div className="utility-row">
              <div className="vol-group" title="Volume">
                <VolumeIcon size={14} className="vol-icon" />
                <input
                  type="range"
                  min="0" max="1" step="0.02"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="vol-slider"
                  aria-label="Volume"
                />
                <span className="vol-pct">{Math.round(volume * 100)}</span>
              </div>

              <button className="playlist-btn" onClick={onTogglePlaylist} title="Open Playlist">
                <ListMusic size={14} />
                <span>PLAYLIST</span>
              </button>
            </div>

            {/* Error pill */}
            {playerError && (
              <div className="error-pill">⚠ {playerError}</div>
            )}

          </div>{/* end ctrl-panel */}
        </div>{/* end console-body */}

        {/* Speaker grille dots */}
        <div className="speaker-grille">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grille-dot" />
          ))}
        </div>

        {/* Wooden feet */}
        <div className="console-feet">
          <div className="foot" />
          <div className="foot" />
        </div>

      </div>{/* end retro-console */}
    </div>
  );
}
