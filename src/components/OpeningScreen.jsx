import React from 'react';
import openingBg from '../assets/opening-bg.jpg';

export default function OpeningScreen({ onEnter }) {
  return (
    <div 
      className="opening-screen"
      style={{
        backgroundImage: `linear-gradient(rgba(8, 10, 20, 0.35), rgba(8, 10, 20, 0.6)), url(${openingBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <h1>UNKA ZAMANA</h1>
      <h2>“Too Chalein Unke Jamane Mein”</h2>
      
      <button className="glass-button" onClick={onEnter}>
        Enter Playlist →
      </button>

      <div className="dedication-block">
        <p className="dedication-main">A little journey back to your zamana, made with love.</p>
        <p className="dedication-author">— Aachal</p>
        <p className="dedication-sub">Dedicated to my beloved Dada & Dadi ❤️</p>
      </div>
    </div>
  );
}
