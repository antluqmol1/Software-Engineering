import React from "react";
import "../styles/GameModes.css";

// Mock data representing different game modes.
// In a real application, this could be fetched from an API or stored in state management.
const gameModes = [
  {
    id: 1,
    title: "Night Out",
    description: "Out on the town!",
    imageUrl: "../assets/familynight.jpg",
    action: () => alert("Joining Night Out!"),
  },
  {
    id: 2,
    title: "Family Friendly",
    description: "Family night!",
    imageUrl: "../assets/familynight.jpg",
    action: () => alert("Joining Family Friendly!"),
  },
  {
    id: 3,
    title: "Mountain Hike",
    description: "Into the woods!",
    imageUrl: "../assets/woods.jpg",
    action: () => alert("Joining Mountain Hike!"),
  },
];

// Individual game mode card component
// Extracting this component allows for better testability and reusability.
const GameModeCard = ({ mode }) => (
  <div className="gamemode-card">
    {/* Image container for the game mode */}
    <div className="gamemode-image-wrapper">
      <img
        src={mode.imageUrl}
        alt={mode.description}
        className="gamemode-image"
      />
    </div>
    {/* Game mode description */}
    <h3>{mode.description}</h3>
    {/* Button that triggers an action when clicked, e.g., navigating to a game mode */}
    <button className="gamemode-button" onClick={mode.action}>
      {mode.title}
    </button>
  </div>
);

// Main GameModes component that renders the game mode options
const GameModes = () => {
  return (
    <div className="gamemodes-container">
      {/* Header section for the game title and subtitle */}
      <header className="gamemodes-header">
        <h1 className="">FunChase</h1>
        <h2>Game Modes</h2>
      </header>
      {/* Section containing all the game modes */}
      <section className="gamemodes">
        {/* Mapping through the gameModes data to create a card for each mode */}
        {gameModes.map((mode) => (
          <GameModeCard key={mode.id} mode={mode} />
        ))}
      </section>
    </div>
  );
};

export default GameModes;
