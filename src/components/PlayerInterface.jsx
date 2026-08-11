import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ListMusic } from 'lucide-react';

export default function PlayerInterface({
  currentSong,
  isPlaying,
  progress,
  duration,
  volume,
  spotifyUser,
  spotifyIsConnected,
  spotifyError,
  isConnecting,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onTogglePlaylist,
  onConnectSpotify,
  onDisconnectSpotify
}) {
  const formatTime = (time) => {
    if (isNaN(time) || time < 0) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const lyricsLines = currentSong.lyrics ? currentSong.lyrics.split('\n') : ["Lyrics will be added soon."];

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

          {/* Spotify Connection Panel */}
          <div className="spotify-connection-panel" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
            {spotifyIsConnected ? (
              <>
                <div className="spotify-status" style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  Connected to Spotify as <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>{spotifyUser?.display_name || 'Premium User'}</span>
                </div>
                <button 
                  className="glass-button disconnect-spotify-btn" 
                  onClick={onDisconnectSpotify}
                  style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '20px' }}
                >
                  Disconnect Spotify
                </button>
              </>
            ) : (
              <>
                <div className="spotify-status" style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                  {isConnecting ? 'Connecting to Spotify...' : 'Connect your Spotify Premium account to play music'}
                </div>
                <button 
                  className="glass-button connect-spotify-btn" 
                  onClick={onConnectSpotify}
                  disabled={isConnecting}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: '#1DB954', 
                    border: 'none', 
                    color: '#fff', 
                    fontWeight: 'bold',
                    padding: '10px 24px',
                    borderRadius: '24px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.893-.982-.336.076-.67-.135-.746-.472-.076-.336.135-.67.472-.746 3.847-.878 7.14-.51 9.817 1.13.292.18.385.563.207.857zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.08-1.182-.413.125-.847-.107-.972-.52-.125-.413.108-.847.52-.972 3.673-1.114 8.238-.575 11.35 1.34.366.226.486.707.26 1.074zm.106-2.833C14.484 8.8 8.01 8.583 4.25 9.725c-.58.175-1.19-.16-1.365-.74-.175-.58.16-1.19.74-1.365 4.316-1.31 11.463-1.066 16.037 1.648.52.308.694.98.385 1.5-.307.52-.98.693-1.5.385z"/></svg>
                  Connect Spotify
                </button>
              </>
            )}

            {/* Error Message Display */}
            {spotifyError && (
              <div 
                className="spotify-error-msg" 
                style={{ 
                  marginTop: '1rem', 
                  color: '#ff8888', 
                  fontSize: '0.85rem', 
                  fontStyle: 'italic', 
                  maxWidth: '280px',
                  background: 'rgba(255, 0, 0, 0.1)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 0, 0, 0.2)'
                }}
              >
                ⚠️ {spotifyError}
              </div>
            )}
          </div>
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
          <button 
            className="btn-icon btn-play" 
            onClick={onPlayPause} 
            disabled={!spotifyIsConnected || !currentSong.spotifyTrackId || !!spotifyError}
            style={{ opacity: (!spotifyIsConnected || !currentSong.spotifyTrackId || !!spotifyError) ? 0.4 : 1 }}
          >
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
