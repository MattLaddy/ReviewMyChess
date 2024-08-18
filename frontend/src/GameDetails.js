import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/styles.css';
import { Chessboard } from "react-chessboard";

const GameDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentFen, setCurrentFen] = useState(''); // State to store the current FEN string
    const { game } = location.state || {}; // Retrieve game data from state

    useEffect(() => {
        if (game) {
            localStorage.setItem('gameDetails', JSON.stringify(game));
            setCurrentFen(game.startingFen); // Set the initial FEN from the game object
        }
    }, [game]);

    const handleBackClick = () => {
        navigate(-1); // Navigate to the previous page
    };

    // Retrieve the game data from localStorage if not available in state
    const storedGame = JSON.parse(localStorage.getItem('gameDetails')) || game;

    if (!storedGame) return <p>No game data available</p>;

    // Debugging statements
    console.log('Stored Game:', storedGame);
    console.log('Stored Game Evaluations:', storedGame.evaluations);

    // Ensure evaluations is an array
    const evaluations = Array.isArray(storedGame.evaluations) ? storedGame.evaluations : [];

    // Handle the click on a move to update the chessboard with the corresponding FEN
    const handleMoveClick = (fen) => {
        setCurrentFen(fen);
    };

    const onDrop = (sourceSquare, targetSquare) => {
        // Handle piece drop logic if needed
    };

    return (
        <div className="game-details-container">
            <button onClick={handleBackClick} className="back-button">Back</button>
            <div className="game-content">
                <div className="moves-container">
                    <h2>Moves</h2>
                    <ul className="game-evaluations">
                        {evaluations.map((evaluation, index) => (
                            <li key={index} onClick={() => handleMoveClick(evaluation.fen)}>
                                Move {index + 1}: {evaluation.move}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="chessboard-container">
                    <Chessboard
                        id="BasicBoard"
                        position={currentFen}
                        onPieceDrop={onDrop}
                        boardOrientation="white"
                    />
                </div>
            </div>
        </div>
    );
};

export default GameDetails;
