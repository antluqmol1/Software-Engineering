import React, { useState, useEffect } from 'react';
import '../styles/RouletteWheel.css'; // Import CSS for styling

const RouletteWheel = () => {
    const participants = ['BOB', 'ALICE', 'ALI'];
    const chosenPerson = 'ALI';
  
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [isSpinning, setIsSpinning] = useState(false);
  
    // Start spinning the wheel
    const spinWheel = () => {
      setSelectedParticipant(null); // Reset selectedParticipant
      setIsSpinning(true);
    };
  
    // Simulate spinning the wheel
    useEffect(() => {
      if (isSpinning) {
        const spinInterval = setInterval(() => {
          const randomIndex = Math.floor(Math.random() * participants.length);
          setSelectedParticipant(participants[randomIndex]);
        }, 100); // Adjust the interval for spinning speed
  
        // Stop spinning after some time (e.g., 3 seconds)
        setTimeout(() => {
          setIsSpinning(false);
          clearInterval(spinInterval);
          setSelectedParticipant(chosenPerson);
        }, 3000); // Adjust the duration of spinning
      }
    }, [isSpinning, participants, chosenPerson]);
  
    // Calculate rotation angle for segments
    const rotationAngle = selectedParticipant
      ? (participants.indexOf(selectedParticipant) + 0.5) * (360 / participants.length)
      : 0;
  
    return (
      <div>
        <h2>Roulette Wheel</h2>
        <div className={`wheel ${isSpinning ? 'spinning' : ''}`} style={{ transform: `rotate(${rotationAngle}deg)` }}>
          {participants.map((participant, index) => (
            <div
              key={index}
              className={`segment ${selectedParticipant === participant ? 'selected' : ''}`}
            >
              {participant}
            </div>
          ))}
          <div className="arrow" />
          <button className="roulette-button" onClick={spinWheel} disabled={isSpinning}>
            Spin the Wheel
          </button>
        </div>
      </div>
    );
  };
  
  export default RouletteWheel;
