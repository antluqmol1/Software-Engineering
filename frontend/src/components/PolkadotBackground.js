import React from 'react';
import imageUrl from '../assets/Polkadots.png';
import imageUrl2 from '../assets/17.png';

const PolkadotBackground = () => {
  const styles = {
    backgroundImage: `url(${imageUrl})`,
    backgroundRepeat: 'repeat',
    opacity: 0.2,
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    backgroundSize: '10px 10px',
    animation: 'moveDiagonal 40s linear infinite alternate', // Animation can be found in app.css
  };

  return (
    <div style={styles}>
    </div>
  );
};

export default PolkadotBackground;
