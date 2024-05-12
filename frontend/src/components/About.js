import React from "react";
import "../styles/About.css";

const About = () => {

  return (
    <div className="about-container">
      <h1 className="about-title">Welcome to FunChase!</h1>

      <div className="section game-info">
        <h2>Game Overview</h2>
        <p>
          FunChase is a social game designed for gatherings where players can join lobbies and engage in three different game modes: "Night out", "Family friendly", and "Mountain hike". 
          Challenges range from funny to skill-based, making each game session exciting. 
        </p>
      </div>

      <div className="section how-to-play">
        <h2>How to Play?</h2>
        <ol>
          <li>Create a user and log in.</li>
          <li>Join or create a lobby.</li>
          <li>The game master chooses a game mode.</li>
          <li>The game master shares the game ID with joining players.</li>
          <li>The game master initiates the game and spins the wheel.</li>
          <li>The selected player attempts the challenge.</li>
          <li>All players vote on whether the challenge was successfully completed.</li>
          <li>Points are then awarded based on the majority vote.</li>
          <li>Continue playing rounds until the game ends, with the player having the most points declared the winner.</li>
        </ol>
      </div>

      <div className="wave-container">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

    </div>
  );
};

export default About;
