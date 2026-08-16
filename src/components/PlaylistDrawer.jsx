import React from 'react';
import { X, PlayCircle } from 'lucide-react';

export default function PlaylistDrawer({ isOpen, onClose, songs, currentIndex, onSelectSong }) {
  return (
    <div className={`playlist-drawer glass-panel ${isOpen ? 'open' : ''}`}>
      <div className="playlist-header">
        <h3 className="serif-text" style={{ fontSize: '1.4rem', color: 'var(--color-gold)' }}>
          Playlist ({songs.length})
        </h3>
        <button className="btn-icon" onClick={onClose} title="Close playlist">
          <X size={22} />
        </button>
      </div>
      
      <div className="playlist-list">
        {songs.map((song, index) => (
          <div 
            key={song.id} 
            className={`playlist-item ${index === currentIndex ? 'active' : ''}`}
            onClick={() => onSelectSong(index)}
            title={`Play #${String(index + 1).padStart(2, '0')} - ${song.title}`}
          >
            <div style={{ opacity: 0.65, width: '28px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
              {String(index + 1).padStart(2, '0')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 500, 
                color: index === currentIndex ? 'var(--color-gold)' : 'inherit',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {song.title}
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {song.singer} {song.year ? `• ${song.year}` : ''}
              </div>
            </div>
            {index === currentIndex && <PlayCircle size={18} color="var(--color-gold)" />}
          </div>
        ))}
      </div>
    </div>
  );
}
