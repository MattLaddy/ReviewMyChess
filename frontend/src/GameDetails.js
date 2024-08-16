import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/styles.css';

const GameDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { game } = location.state || {}; // Retrieve game data from state

    useEffect(() => {
        if (game) {
            localStorage.setItem('gameDetails', JSON.stringify(game));
        }
    }, [game]);

    const handleBackClick = () => {
        navigate(-1); // Navigate to the previous page
    };

    // Retrieve the game data from localStorage if not available in state
    const storedGame = JSON.parse(localStorage.getItem('gameDetails')) || game;

    if (!storedGame) return <p>No game data available</p>;

    return (
        <div className="game-details">
            <button onClick={handleBackClick} className="back-button">Back</button>
            <h1>Game Details</h1>
            <div className="game-info">
                <p><strong>White:</strong> {storedGame.game.white.username} <strong>White Rating:</strong> {storedGame.game.white.rating}</p>
                <p><strong>Black:</strong> {storedGame.game.black.username} <strong>Black Rating:</strong> {storedGame.game.black.rating}</p>
                <h2>Evaluations</h2>
                <ul>
                    {storedGame.evaluations.map((evaluation, index) => (
                        <li key={index}>
                            Move: {evaluation.move}, Swing: {evaluation.swing}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default GameDetails;
