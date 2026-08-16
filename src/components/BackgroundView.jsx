import React, { useState, useEffect } from 'react';
import bg1 from '../assets/bg1.jpg';
import bg2 from '../assets/bg2.jpg';
import bg3 from '../assets/bg3.jpg';
import bg4 from '../assets/bg4.jpg';
import bg5 from '../assets/bg5.jpg';
import bg6 from '../assets/bg6.jpg';

const backgroundImages = [bg1, bg2, bg3, bg4, bg5, bg6];

export default function BackgroundView({ currentSongIndex = 0 }) {
  // backgroundIndex = currentSongIndex % 6
  const targetIndex = ((currentSongIndex % 6) + 6) % 6;
  const [activeIdx, setActiveIdx] = useState(targetIndex);
  const [prevIdx, setPrevIdx] = useState(null);

  useEffect(() => {
    if (targetIndex !== activeIdx) {
      setPrevIdx(activeIdx);
      setActiveIdx(targetIndex);

      // Clean up previous image after crossfade transition completes (1.8s)
      const timer = setTimeout(() => {
        setPrevIdx(null);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [targetIndex, activeIdx]);

  return (
    <div className="bg-container">
      {prevIdx !== null && (
        <div
          key={`prev-${prevIdx}`}
          className="bg-image bg-fade-out"
          style={{ backgroundImage: `url(${backgroundImages[prevIdx]})` }}
        />
      )}
      <div
        key={`active-${activeIdx}`}
        className="bg-image bg-fade-in"
        style={{ backgroundImage: `url(${backgroundImages[activeIdx]})` }}
      />
      {/* Subtle cinematic vignette overlay */}
      <div className="bg-film-overlay" />
    </div>
  );
}
