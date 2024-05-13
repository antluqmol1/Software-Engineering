import React from 'react';
import imageUrl from '../assets/Polkadots2.png';

const PolkadotBackground = () => {
  const styles = {
    backgroundImage: `url(${imageUrl})`,
    backgroundRepeat: 'repeat',
    opacity: 0.2, // Adjust opacity to make it more transparent
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    backgroundSize: '80px 80px', // Set the size of each repeated image
    animation: 'moveDiagonal 40s linear infinite alternate', // Animation definition
  };

  return (
    <div style={styles}>
      {/* Optional: Add content over the background */}
    </div>
  );
};

export default PolkadotBackground;
