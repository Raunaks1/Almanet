import React from 'react';
import './MeshBackground.css';

/**
 * Fixed, app-wide ambient mesh gradient sitting behind everything so glass
 * surfaces have something to blur. Decorative only: aria-hidden, no pointer
 * events, animates `transform` alone, and goes static under reduced motion.
 */
const MeshBackground: React.FC = () => (
  <div className="mesh" aria-hidden="true">
    <div className="mesh__blob mesh__blob--lavender" />
    <div className="mesh__blob mesh__blob--blue" />
    <div className="mesh__blob mesh__blob--sage" />
    <div className="mesh__blob mesh__blob--accent" />
  </div>
);

export default MeshBackground;
