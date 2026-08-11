import React, { useEffect, useRef, useState } from 'react';

export default function SpotifyPlayer({
  token,
  trackId,
  isPlaying,
  volume,
  onStateChange,
  onPlayerReady,
  onError,
  playerRef
}) {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const currentTrackId = useRef(null);
  const tokenRef = useRef(token);

  // Keep token updated in ref so player getOAuthToken always has access to the freshest token
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Load SDK Script
  useEffect(() => {
    if (!token) return;

    if (window.Spotify) {
      initializePlayer();
      return;
    }

    // Set up global callback for the Spotify SDK
    window.onSpotifyWebPlaybackSDKReady = () => {
      initializePlayer();
    };

    // Check if script is already injected
    if (!document.getElementById('spotify-sdk-script')) {
      const script = document.createElement('script');
      script.id = 'spotify-sdk-script';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [token]);

  const initializePlayer = () => {
    if (!tokenRef.current || player) return;

    const newPlayer = new window.Spotify.Player({
      name: 'Unka Zamana Web Player',
      getOAuthToken: (cb) => cb(tokenRef.current),
      volume: volume
    });

    // Error handling
    newPlayer.addListener('initialization_error', ({ message }) => {
      console.error('Initialization Error:', message);
      onError('initialization_error', `Initialization Error: ${message}`);
    });
    newPlayer.addListener('authentication_error', ({ message }) => {
      console.error('Authentication Error:', message);
      onError('authentication_error', `Authentication Error: ${message}`);
    });
    newPlayer.addListener('account_error', ({ message }) => {
      console.error('Account Error:', message);
      onError('account_error', `Account Error: ${message}`);
    });
    newPlayer.addListener('playback_error', ({ message }) => {
      console.error('Playback Error:', message);
      onError('playback_error', `Playback Error: ${message}`);
    });

    // Playback status updates
    newPlayer.addListener('player_state_changed', (state) => {
      if (state) {
        onStateChange(state);
      }
    });

    // Ready
    newPlayer.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID:', device_id);
      setDeviceId(device_id);
      if (onPlayerReady) onPlayerReady(device_id);
    });

    // Not Ready
    newPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline:', device_id);
      setDeviceId(null);
    });

    newPlayer.connect().then(success => {
      if (success) {
        console.log('Connected to Spotify Web Playback SDK');
      }
    });

    setPlayer(newPlayer);
    if (playerRef) playerRef.current = newPlayer;
  };

  // Disconnect player when token is cleared (logout)
  useEffect(() => {
    if (!token && player) {
      player.disconnect();
      setPlayer(null);
      setDeviceId(null);
      currentTrackId.current = null;
      if (playerRef) playerRef.current = null;
    }
  }, [token, player]);

  // Handle Play/Pause state changes from UI
  useEffect(() => {
    if (!player || !deviceId) return;

    player.getCurrentState().then(state => {
      if (!state) return;
      
      const spotifyPaused = state.paused;
      if (isPlaying && spotifyPaused) {
        player.resume().catch((err) => console.error('Resume failed:', err));
      } else if (!isPlaying && !spotifyPaused) {
        player.pause().catch((err) => console.error('Pause failed:', err));
      }
    });
  }, [isPlaying, player, deviceId]);

  // Handle Track changes
  useEffect(() => {
    if (!player || !deviceId || !trackId) return;

    if (currentTrackId.current === trackId) return;
    currentTrackId.current = trackId;

    playTrack(trackId);
  }, [trackId, player, deviceId]);

  // Handle Volume changes
  useEffect(() => {
    if (player) {
      player.setVolume(volume).catch((err) => console.error('Set volume failed:', err));
    }
  }, [volume, player]);

  const playTrack = (spotifyTrackId) => {
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRef.current}`
      },
      body: JSON.stringify({
        uris: [`spotify:track:${spotifyTrackId}`]
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          let errMsg = 'Unknown error';
          try {
            const data = await res.json();
            errMsg = data.error?.message || data.error?.reason || JSON.stringify(data);
          } catch (e) {
            errMsg = `Status ${res.status}`;
          }
          console.error('Play error response:', errMsg);
          
          if (res.status === 403) {
             onError('playback_error', `Playback Error (403): ${errMsg}`);
          } else if (res.status === 404) {
             onError('playback_error', `Playback Error (404): Device or track not found on Spotify. Details: ${errMsg}`);
          } else {
             onError('playback_error', `Playback Error (${res.status}): ${errMsg}`);
          }
        }
      })
      .catch((err) => {
        console.error('Play request failed:', err);
        onError('playback_error', 'Network error during playback request.');
      });
  };

  return null;
}
