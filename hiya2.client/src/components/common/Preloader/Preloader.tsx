import React, { useState, useEffect } from 'react';
import './Preloader.css';

interface PreloaderProps {
  logoSrc?: string;
  onComplete?: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({
  logoSrc = '/image/HIYA LOGO (1).png',
  onComplete
}) => {
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isDestroyed, setIsDestroyed] = useState<boolean>(false);

  useEffect(() => {
    // Fast & snappy: 800ms total entrance + quick exit
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      document.body.classList.add('preloader-done');
      window.dispatchEvent(new CustomEvent('preloaderComplete'));
      if (onComplete) onComplete();
    }, 850);

    // Unmount completely from DOM in 1.1s
    const destroyTimer = setTimeout(() => {
      setIsDestroyed(true);
    }, 1150);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(destroyTimer);
    };
  }, [onComplete]);

  if (isDestroyed) return null;

  return (
    <div className={`hg-pure-loader ${isExiting ? 'is-exiting' : ''}`} aria-hidden="true">
      {/* Subtle organic liquid glow behind logo */}
      <div className="hg-liquid-glow" />

      {/* Main Logo Showcase */}
      <div className="hg-logo-stage">
        
        {/* Orbiting Gold Sparks / Particle Ring */}
        <div className="hg-spark-orbit">
          <span className="hg-spark spark-1" />
          <span className="hg-spark spark-2" />
          <span className="hg-spark spark-3" />
          <span className="hg-spark spark-4" />
        </div>

        {/* Liquid Gold Morphing Border */}
        <div className="hg-morph-ring" />

        {/* The Core Logo */}
        <div className="hg-logo-core">
          {/* Fast Shimmer Sweep */}
          <div className="hg-shimmer-wave" />
          <img src={logoSrc} alt="Hiya Ghar" className="hg-pure-logo-img" />
        </div>
      </div>
    </div>
  );
};
