import React, { useEffect, useRef, useState } from 'react';

export default function SpotifyPlayer({
  token,
  trackId,
  trackTitle,
  trackSinger,
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
      onError('initialization_error', `Initialization Error: ${message}`);
    });
    newPlayer.addListener('authentication_error', ({ message }) => {
      onError('authentication_error', `Authentication Error: ${message}`);
    });
    newPlayer.addListener('account_error', ({ message }) => {
      onError('account_error', `Account Error: ${message}`);
    });
    newPlayer.addListener('playback_error', ({ message }) => {
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
      setDeviceId(device_id);
      if (onPlayerReady) onPlayerReady(device_id);
    });

    // Not Ready
    newPlayer.addListener('not_ready', ({ device_id }) => {
      setDeviceId(null);
    });

    newPlayer.connect();

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
        player.resume().catch(() => {});
      } else if (!isPlaying && !spotifyPaused) {
        player.pause().catch(() => {});
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
      player.setVolume(volume).catch(() => {});
    }
  }, [volume, player]);

  const playTrack = async (spotifyTrackId) => {
    try {
      // 1. Explicitly transfer playback to this device first
      const transferRes = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ device_ids: [deviceId], play: false })
      });

      if (!transferRes.ok && transferRes.status !== 202 && transferRes.status !== 204) {
        onError('playback_error', `Transfer failed: ${transferRes.status}`);
        return;
      }

      // Poll for active
      let isActive = false;
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const checkRes = await fetch('https://api.spotify.com/v1/me/player', { headers: { Authorization: `Bearer ${tokenRef.current}` } });
        if (checkRes.ok && checkRes.status !== 204) {
          const checkData = await checkRes.json();
          if (checkData.device?.id === deviceId && checkData.device?.is_active) {
            isActive = true;
            break;
          }
        }
      }

      // 2. Play the specific track
      let trackUri = `spotify:track:${spotifyTrackId}`;
      let playRes = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ uris: [trackUri] })
      });

      // 3. Fallback: If 400, 403 or 404, it might be a market restriction or missing ID. Search dynamically!
      if (!playRes.ok && (playRes.status === 400 || playRes.status === 403 || playRes.status === 404)) {
        
        let queryStr = `track:${trackTitle || ''}`;
        if (trackSinger) {
          queryStr += ` artist:${trackSinger.split(',')[0]}`;
        }
        
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(queryStr)}&type=track&limit=1`, {
          headers: { Authorization: `Bearer ${tokenRef.current}` }
        });
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.tracks && searchData.tracks.items.length > 0) {
            trackUri = searchData.tracks.items[0].uri;
            
            // Retry play with the localized track URI
            playRes = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
              body: JSON.stringify({ uris: [trackUri] })
            });
          }
        }
      }

      if (!playRes.ok) {
        let errMsg = 'Unknown error';
        try {
          const data = await playRes.json();
          errMsg = data.error?.message || data.error?.reason || JSON.stringify(data);
        } catch (e) {
          errMsg = `Status ${playRes.status}`;
        }
        
        if (playRes.status === 403) {
           onError('playback_error', `Playback Error (403): ${errMsg}`);
        } else if (playRes.status === 404) {
           onError('playback_error', `Playback Error (404): Device or track not found on Spotify. Details: ${errMsg}`);
        } else {
           onError('playback_error', `Playback Error (${playRes.status}): ${errMsg}`);
        }
      }
    } catch (err) {
      onError('playback_error', 'Network error during playback request.');
    }
  };

  return null;
}
