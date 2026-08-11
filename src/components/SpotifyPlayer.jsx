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
      console.log(`[Spotify API] --- STARTING EXTENDED DIAGNOSTIC PLAYBACK SEQUENCE ---`);
      
      // DIAGNOSTIC 0: User Profile & Product
      try {
        const meRes = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${tokenRef.current}` } });
        if (meRes.ok) {
          const meData = await meRes.json();
          console.log('[Spotify API] User Profile:', {
            product: meData.product,
            country: meData.country,
            explicit_content: meData.explicit_content,
            display_name: meData.display_name
          });
        }
      } catch (e) {
        console.error('[Spotify API] Failed to fetch /v1/me');
      }

      // DIAGNOSTIC 1: Track Metadata
      try {
        const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${spotifyTrackId}`, { headers: { Authorization: `Bearer ${tokenRef.current}` } });
        if (trackRes.ok) {
          const trackData = await trackRes.json();
          console.log('[Spotify API] Track Info:', {
            id: trackData.id,
            name: trackData.name,
            is_playable: trackData.is_playable,
            available_markets: trackData.available_markets ? `[${trackData.available_markets.length} markets]` : 'N/A',
            restrictions: trackData.restrictions
          });
        }
      } catch (e) {
        console.error('[Spotify API] Failed to fetch track metadata');
      }

      // DIAGNOSTIC 2: Check Devices
      let targetDevice = null;
      try {
        const devicesRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
          headers: { Authorization: `Bearer ${tokenRef.current}` }
        });
        if (devicesRes.ok) {
          const devicesData = await devicesRes.json();
          targetDevice = devicesData.devices.find(d => d.id === deviceId);
          if (targetDevice) {
            console.log('[Spotify API] Web Playback SDK Device Object:', {
              id: targetDevice.id,
              name: targetDevice.name,
              type: targetDevice.type,
              is_active: targetDevice.is_active,
              is_private_session: targetDevice.is_private_session,
              is_restricted: targetDevice.is_restricted,
              supports_volume: targetDevice.supports_volume,
              volume_percent: targetDevice.volume_percent
            });
          }
        }
      } catch (e) {
        console.error('[Spotify API] Network error fetching devices:', e);
      }

      if (targetDevice && targetDevice.is_restricted) {
        console.error('[Spotify API] The Web Playback SDK device is marked as restricted by Spotify.');
        onError('account_error', 'Your Spotify account/product is restricted from using Web Playback on this device.');
        return;
      }

      // 3. Transfer playback
      console.log(`[Spotify API] Transferring playback to device: ${deviceId}`);
      const transferRes = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ device_ids: [deviceId], play: false })
      });
      console.log(`[Spotify API] PUT /v1/me/player (Transfer) Status: ${transferRes.status}`);

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
          
          if (i === 2) {
             console.log('[Spotify API] Player State after Transfer:', {
                current_device: checkData.device?.name,
                device_id: checkData.device?.id,
                device_type: checkData.device?.type,
                is_active: checkData.device?.is_active,
                restrictions: checkData.device?.is_restricted,
                currently_playing_track: checkData.item?.uri
             });
          }

          if (checkData.device?.id === deviceId && checkData.device?.is_active) {
            isActive = true;
            break;
          }
        }
      }

      // 4. Play the specific track
      const trackUri = `spotify:track:${spotifyTrackId}`;
      console.log(`[Spotify API] Requesting play for URI: ${trackUri}`);
      
      const playRes = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ uris: [trackUri] })
      });

      console.log(`[Spotify API] PUT /v1/me/player/play Status: ${playRes.status}`);

      if (!playRes.ok) {
        let errMsg = 'Unknown error';
        try {
          const data = await playRes.json();
          errMsg = data.error?.message || data.error?.reason || JSON.stringify(data);
          console.error(`[Spotify API] Play endpoint failed. Body:`, data);
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
