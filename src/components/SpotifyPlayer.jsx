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

  const playTrack = async (spotifyTrackId) => {
    try {
      console.log(`[Spotify API] --- DIAGNOSTICS FOR PLAYBACK ---`);
      
      // DIAGNOSTIC 1: Check Devices
      try {
        const devicesRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
          headers: { Authorization: `Bearer ${tokenRef.current}` }
        });
        if (devicesRes.ok) {
          const devicesData = await devicesRes.json();
          console.log('[Spotify API] Available Devices:', devicesData.devices.map(d => ({
            id: d.id, name: d.name, type: d.type, is_active: d.is_active, is_restricted: d.is_restricted
          })));
        } else {
          console.error('[Spotify API] Failed to fetch devices. Status:', devicesRes.status);
        }
      } catch (e) {
        console.error('[Spotify API] Network error fetching devices:', e);
      }

      // DIAGNOSTIC 2: Check Player State
      try {
        const stateRes = await fetch('https://api.spotify.com/v1/me/player', {
          headers: { Authorization: `Bearer ${tokenRef.current}` }
        });
        if (stateRes.ok && stateRes.status !== 204) {
          const stateData = await stateRes.json();
          console.log('[Spotify API] Current Player State before transfer:', {
            device: stateData.device?.name,
            is_playing: stateData.is_playing,
            actions: stateData.actions
          });
        } else {
          console.log('[Spotify API] Current Player State before transfer: None (204 or no active device)');
        }
      } catch (e) {
        console.error('[Spotify API] Network error fetching player state:', e);
      }

      console.log(`[Spotify API] --- END DIAGNOSTICS ---`);

      // 1. Explicitly transfer playback to this device first
      const transferRes = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenRef.current}`
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        })
      });

      if (!transferRes.ok && transferRes.status !== 202 && transferRes.status !== 204) {
        console.error(`[Spotify API] Transfer Playback failed with status: ${transferRes.status}`);
        try {
          const errBody = await transferRes.json();
          console.error('[Spotify API] Transfer Error Body:', errBody);
        } catch (e) {
          console.error('[Spotify API] Could not parse transfer error body');
        }
      }

      // Small delay to ensure Spotify registers the active device
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Play the specific track
      const trackUri = `spotify:track:${spotifyTrackId}`;
      console.log(`[Spotify API] Requesting play for URI: ${trackUri} on device: ${deviceId}`);
      
      const playRes = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenRef.current}`
        },
        body: JSON.stringify({
          uris: [trackUri]
        })
      });

      if (!playRes.ok) {
        let errMsg = 'Unknown error';
        try {
          const data = await playRes.json();
          errMsg = data.error?.message || data.error?.reason || JSON.stringify(data);
          console.error(`[Spotify API] Play endpoint failed. Status: ${playRes.status}, Body:`, data);
        } catch (e) {
          errMsg = `Status ${playRes.status}`;
          console.error(`[Spotify API] Play endpoint failed with status: ${playRes.status}`);
        }
        
        if (playRes.status === 403) {
           onError('playback_error', `Playback Error (403): ${errMsg}`);
        } else if (playRes.status === 404) {
           onError('playback_error', `Playback Error (404): Device or track not found on Spotify. Details: ${errMsg}`);
        } else {
           onError('playback_error', `Playback Error (${playRes.status}): ${errMsg}`);
        }
      } else {
        console.log(`[Spotify API] Successfully started playback for ${trackUri}`);
      }
    } catch (err) {
      console.error('[Spotify API] Network error during playback sequence:', err);
      onError('playback_error', 'Network error during playback request.');
    }
  };

  return null;
}
