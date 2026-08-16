import React, { useState, useEffect } from 'react';

const dedicationQuotes = [
  "उनके आँगन की वो शामें, आज भी दिल में रोशनी करती हैं।",
  "दादा-दादी की बातें, गाँव की गलियाँ और वो सुकून भरे दिन।",
  "जहाँ रिश्ते पास थे, और खुशियाँ बहुत छोटी-सी बातों में मिल जाती थीं।",
  "उनके साथ बिताया हर पल, आज एक खूबसूरत याद बनकर लौटता है।",
  "वो पुराना घर, मिट्टी की खुशबू और अपनों से भरी वो दुनिया।",
  "दादी की कहानियाँ और दादा की मुस्कान — हमारा सबसे प्यारा बचपन।",
  "कुछ गीत सिर्फ गीत नहीं होते, वे हमें अपने लोगों तक वापस ले जाते हैं।",
  "उस ज़माने की शामें कुछ और थीं — धीमी, सादगी भरी और अपनी-सी।",
  "जो गाँव पीछे छूट गया, उसकी यादें आज भी इन धुनों में बसती हैं।",
  "दादा-दादी की यादों को समर्पित — उन दिनों के नाम, जो कभी पुराने नहीं होंगे।"
];

export default function RotatingDedication() {
  const [index, setIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      const timer = setTimeout(() => {
        setIndex((prev) => (prev + 1) % dedicationQuotes.length);
        setIsFading(false);
      }, 550);
      return () => clearTimeout(timer);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rotating-dedication-wrap" aria-live="polite">
      <p className={`rotating-dedication-text ${isFading ? 'fade-out' : 'fade-in'}`}>
        {dedicationQuotes[index]}
      </p>
    </div>
  );
}
