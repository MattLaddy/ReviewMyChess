import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/styles.css';
import { Chessboard } from "react-chessboard";
import axios from 'axios';

const GameDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentFen, setCurrentFen] = useState('');
    const [game, setGame] = useState(null); // State to store the game data
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch game data from localStorage or API
        const fetchGameData = async () => {
            setLoading(true);

            // Retrieve stored game data from localStorage
            const storedGame = JSON.parse(localStorage.getItem('gameDetails'));

            if (storedGame) {
                // Use stored game data if available
                setGame(storedGame);
                setCurrentFen(storedGame.startingFen);
                setEvaluations(storedGame.evaluations || []);
            } else if (location.state?.game) {
                // Fetch new game data from API if not in localStorage
                try {
                    const gameData = location.state.game;
                    setGame(gameData);
                    setCurrentFen(gameData.startingFen);
                    setEvaluations(gameData.evaluations || []);

                    // Store the new game data in localStorage
                    localStorage.setItem('gameDetails', JSON.stringify(gameData));
                } catch (error) {
                    console.error('Error fetching game data:', error);
                }
            }

            setLoading(false);
        };

        fetchGameData();
    }, [location.state]);

    const handleBackClick = () => {
        navigate(-1); // Navigate to the previous page
    };

    const handleMoveClick = (fen) => {
        setCurrentFen(fen);
    };

    const onDrop = (sourceSquare, targetSquare) => {
        // Handle piece drop logic if needed
    };

    if (loading) return <p>Loading...</p>;
    if (!game) return <p>No game data available</p>;

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
