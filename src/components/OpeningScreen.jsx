import React from 'react';

export default function OpeningScreen({ onEnter }) {
  return (
    <div className="opening-screen">
      <h1>UNKA ZAMANA 🌙</h1>
      <h2>“Kuch gaane... kuch yaadein... aur ek poori zindagi.”</h2>
      <p>50 songs from a time when memories were made slowly.</p>
      <button className="glass-button" onClick={onEnter}>
        Enter Playlist →
      </button>
    </div>
  );
}
