import React from 'react';
import { X, PlayCircle } from 'lucide-react';

export default function PlaylistDrawer({ isOpen, onClose, songs, currentIndex, onSelectSong }) {
  return (
    <div className={`playlist-drawer glass-panel ${isOpen ? 'open' : ''}`}>
      <div className="playlist-header">
        <h3 className="serif-text" style={{ fontSize: '1.5rem', color: 'var(--color-gold)' }}>Up Next</h3>
        <button className="btn-icon" onClick={onClose}>
          <X size={24} />
        </button>
      </div>
      
      <div className="playlist-list">
        {songs.map((song, index) => (
          <div 
            key={song.id} 
            className={`playlist-item ${index === currentIndex ? 'active' : ''}`}
            onClick={() => onSelectSong(index)}
          >
            <div style={{ opacity: 0.5, width: '20px', fontSize: '0.9rem' }}>{index + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, color: index === currentIndex ? 'var(--color-gold)' : 'inherit' }}>
                {song.title}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                {song.singer} • {song.year}
              </div>
            </div>
            {index === currentIndex && <PlayCircle size={20} color="var(--color-gold)" />}
          </div>
        ))}
      </div>
    </div>
  );
}
