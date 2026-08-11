import React, { useState, useEffect, useRef } from 'react';
import OpeningScreen from './components/OpeningScreen';
import BackgroundView from './components/BackgroundView';
import PlayerInterface from './components/PlayerInterface';
import PlaylistDrawer from './components/PlaylistDrawer';
import SpotifyPlayer from './components/SpotifyPlayer';
import { songs } from './data/songs';
import {
  redirectToSpotifyAuth,
  getAccessToken,
  clearSpotifyAuth,
  getSpotifyUserProfile,
  getValidAccessToken
} from './utils/spotifyAuth';

function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  
  // Spotify Integration States
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [spotifyIsConnected, setSpotifyIsConnected] = useState(false);
  const [spotifyError, setSpotifyError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const spotifyPlayerRef = useRef(null);
  const currentSong = songs[currentSongIndex];

  // Handle Spotify OAuth Callback & Auto Session Restoration
  useEffect(() => {
    const handleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        setIsConnecting(true);
        // Clear params from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        try {
          const token = await getAccessToken(code);
          setSpotifyToken(token);
          const profile = await getSpotifyUserProfile(token);
          
          if (profile.product !== 'premium') {
            throw new Error('Spotify Premium is required for Web Playback SDK streaming.');
          }
          
          setSpotifyUser(profile);
          setSpotifyIsConnected(true);
          setSpotifyError(null);
        } catch (err) {
          console.error('Spotify Auth Error:', err);
          setSpotifyError(err.message || 'Authentication failed.');
          clearSpotifyAuth();
          setSpotifyToken(null);
          setSpotifyIsConnected(false);
        } finally {
          setIsConnecting(false);
        }
      } else {
        // Try restoring token
        try {
          const token = await getValidAccessToken();
          if (token) {
            setSpotifyToken(token);
            const profile = await getSpotifyUserProfile(token);
            if (profile.product !== 'premium') {
              throw new Error('Spotify Premium is required for Web Playback SDK streaming.');
            }
            setSpotifyUser(profile);
            setSpotifyIsConnected(true);
            setSpotifyError(null);
          }
        } catch (err) {
          console.error('Restore Spotify session failed:', err);
          setSpotifyError(err.message || 'Failed to reconnect Spotify.');
          clearSpotifyAuth();
          setSpotifyToken(null);
          setSpotifyIsConnected(false);
        }
      }
    };
    
    handleAuth();
  }, []);

  // Update position locally when track is playing
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= duration) {
            clearInterval(interval);
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Check track availability whenever current song changes
  useEffect(() => {
    if (spotifyIsConnected) {
      if (!currentSong.spotifyTrackId) {
        setSpotifyError("Unavailable Track. This song is not configured for Spotify playback.");
        setIsPlaying(false);
      } else {
        setSpotifyError(null);
      }
    }
  }, [currentSongIndex, spotifyIsConnected]);

  const handleConnectSpotify = () => {
    redirectToSpotifyAuth();
  };

  const handleDisconnectSpotify = () => {
    clearSpotifyAuth();
    setSpotifyToken(null);
    setSpotifyUser(null);
    setSpotifyIsConnected(false);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setSpotifyError(null);
  };

  const handlePlayPause = () => {
    if (!currentSong.spotifyTrackId || spotifyError) return;
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const nextIndex = (currentSongIndex + 1) % songs.length;
    setCurrentSongIndex(nextIndex);
    const nextSong = songs[nextIndex];
    
    if (spotifyIsConnected) {
      if (nextSong.spotifyTrackId) {
        setSpotifyError(null);
        setIsPlaying(true);
      } else {
        setSpotifyError("Unavailable Track. This song is not configured for Spotify playback.");
        setIsPlaying(false);
      }
    }
  };

  const handlePrev = () => {
    if (progress > 5) {
      spotifyPlayerRef.current?.seek(0).catch(() => {});
      setProgress(0);
    } else {
      const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
      setCurrentSongIndex(prevIndex);
      const prevSong = songs[prevIndex];

      if (spotifyIsConnected) {
        if (prevSong.spotifyTrackId) {
          setSpotifyError(null);
          setIsPlaying(true);
        } else {
          setSpotifyError("Unavailable Track. This song is not configured for Spotify playback.");
          setIsPlaying(false);
        }
      }
    }
  };

  const handleSeek = (newTime) => {
    spotifyPlayerRef.current?.seek(newTime * 1000).then(() => {
      setProgress(newTime);
    }).catch((err) => console.error('Seek failed:', err));
  };

  const handleSelectSong = (index) => {
    setCurrentSongIndex(index);
    const selectedSong = songs[index];

    if (spotifyIsConnected) {
      if (selectedSong.spotifyTrackId) {
        setSpotifyError(null);
        setIsPlaying(true);
      } else {
        setSpotifyError("Unavailable Track. This song is not configured for Spotify playback.");
        setIsPlaying(false);
      }
    }

    if (window.innerWidth <= 768) {
      setIsPlaylistOpen(false); // Close drawer on mobile after picking
    }
  };

  // Callback from Spotify Player when position/state changes
  const handleSpotifyStateChange = (state) => {
    if (!state) return;
    setProgress(state.position / 1000);
    setDuration(state.duration / 1000);
    setIsPlaying(!state.paused);
  };

  const handleSpotifyError = (type, message) => {
    setSpotifyError(message);
    if (type === 'authentication_error') {
      handleDisconnectSpotify();
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <div className="app-container">
      {/* Debug display for Spotify playback status */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 9999, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '15px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
        <div>CURRENT SONG</div>
        <div style={{ color: 'var(--color-gold)' }}>Title: {currentSong?.title}</div>
        <br />
        <div>SPOTIFY TRACK ID:</div>
        <div style={{ color: 'var(--color-gold)' }}>{currentSong?.spotifyTrackId || 'NONE'}</div>
        <br />
        <div>SOURCE:</div>
        <div style={{ color: 'var(--color-gold)' }}>Spotify Web Playback SDK</div>
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
            spotifyUser={spotifyUser}
            spotifyIsConnected={spotifyIsConnected}
            spotifyError={spotifyError}
            isConnecting={isConnecting}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrev={handlePrev}
            onSeek={handleSeek}
            onVolumeChange={setVolume}
            onTogglePlaylist={() => setIsPlaylistOpen(!isPlaylistOpen)}
            onConnectSpotify={handleConnectSpotify}
            onDisconnectSpotify={handleDisconnectSpotify}
          />

          <PlaylistDrawer 
            isOpen={isPlaylistOpen} 
            onClose={() => setIsPlaylistOpen(false)}
            songs={songs}
            currentIndex={currentSongIndex}
            onSelectSong={handleSelectSong}
          />

          {spotifyToken && (
            <SpotifyPlayer
              token={spotifyToken}
              trackId={currentSong?.spotifyTrackId}
              isPlaying={isPlaying}
              volume={volume}
              onStateChange={handleSpotifyStateChange}
              onError={handleSpotifyError}
              playerRef={spotifyPlayerRef}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;

