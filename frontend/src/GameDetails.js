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
        const fetchGameData = async () => {
            setLoading(true);

            const storedGame = JSON.parse(localStorage.getItem('gameDetails'));

            if (storedGame) {
                setGame(storedGame);
                setCurrentFen(storedGame.startingFen);
                setEvaluations(storedGame.evaluations || []);
            } else if (location.state?.game) {
                try {
                    const gameData = location.state.game;
                    setGame(gameData);
                    setCurrentFen(gameData.startingFen);
                    setEvaluations(gameData.evaluations || []);
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
        navigate(-1);
    };

    const handleMoveClick = (fen) => {
        setCurrentFen(fen);
    };

    const onDrop = (sourceSquare, targetSquare) => {
        // Handle piece drop logic if needed
    };

    if (loading) return <p>Analyzing Positions...</p>;
    if (!game) return <p>No game data available</p>;

const moveIndicatorStyle = (type) => {
    console.log(type);
    switch (type) {
        case 'blunder':
            return { backgroundColor: '#ee2400', color: '#fff' }; // Deep red for blunders
        case 'mistake':
            return { backgroundColor: '#f5c6cb', color: '#721c24' }; // Light red for mistakes
        case 'inaccuracy':
            return { backgroundColor: '#f8d7da', color: '#721c24' }; // Lighter red for inaccuracies
        case 'slightly_accurate':
            return { backgroundColor: '#d1ecf1', color: '#0c5460' }; // Light blue for slightly accurate moves
        case 'strong_move':
            return { backgroundColor: '#d4edda', color: '#155724' }; // Light green for strong moves
        case 'brilliant':
            return { backgroundColor: '#c3e6cb', color: '#155724' }; // Lighter green for brilliant moves
        case 'normal':
            return { backgroundColor: '#e2e3e5', color: '#6c757d' }; // Light gray for normal moves
        default:
            return { backgroundColor: '#e2e3e5', color: '#6c757d' }; // Default color
    }
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
                                <span
                                    className="move-indicator"
                                    style={moveIndicatorStyle(evaluation.classification)}
                                />
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
