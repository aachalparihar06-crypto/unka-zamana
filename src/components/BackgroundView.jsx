import React, { useState, useEffect } from 'react';

export default function BackgroundView({ currentGroup }) {
  const [activeGroup, setActiveGroup] = useState(currentGroup);
  const [prevGroup, setPrevGroup] = useState(null);

  useEffect(() => {
    if (currentGroup !== activeGroup) {
      setPrevGroup(activeGroup);
      setActiveGroup(currentGroup);
      
      // Remove prev after crossfade
      const timer = setTimeout(() => {
        setPrevGroup(null);
      }, 3000); // 3s crossfade
      return () => clearTimeout(timer);
    }
  }, [currentGroup, activeGroup]);

  // We have 6 images, so we map group 1-10 to bg1-bg6
  const getBgPath = (group) => `/bg${((group - 1) % 6) + 1}.png`;

  return (
    <div className="bg-container">
      {prevGroup && (
        <div 
          className="bg-image active" 
          style={{ backgroundImage: `url(${getBgPath(prevGroup)})`, zIndex: 1, opacity: 0 }} 
        />
      )}
      <div 
        className="bg-image active" 
        style={{ backgroundImage: `url(${getBgPath(activeGroup)})`, zIndex: 2 }} 
      />
    </div>
  );
}
