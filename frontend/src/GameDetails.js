import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chessboard } from "react-chessboard";
import { Chess } from 'chess.js';
import './styles/styles.css';
import Footer from './components/Footer';

const GameDetails = () => {
    
    const location = useLocation();
    const navigate = useNavigate();
    const [currentFen, setCurrentFen] = useState('');
    const [game, setGame] = useState(null);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chess, setChess] = useState(new Chess());

    useEffect(() => {
        const gameData = location.state?.game;

        if (gameData) {
            setGame(gameData);
            setCurrentFen(gameData.startingFen);
            setEvaluations(gameData.evaluations || []);
            setChess(new Chess(gameData.startingFen));
            setLoading(false);
        } else {
            navigate('/');
        }
    }, [location.state, navigate]);


    const handleBackClick = () => {
        navigate(-1);
    };

    const handleMoveClick = (fen) => {
        setCurrentFen(fen);
        setChess(new Chess(fen));
    };

    const onDrop = (sourceSquare, targetSquare) => {
        const move = chess.move({ from: sourceSquare, to: targetSquare });
        if (move === null) return 'snapback';

        setCurrentFen(chess.fen());
    };

    const moveIndicatorStyle = (type) => {
        switch (type) {
            case 'blunder':
                return { backgroundColor: '#ee2400', color: '#fff' };
            case 'mistake':
                return { backgroundColor: '#f5c6cb', color: '#721c24' };
            case 'inaccuracy':
                return { backgroundColor: '#f8d7da', color: '#721c24' };
            case 'slightly_accurate':
                return { backgroundColor: '#d1ecf1', color: '#0c5460' };
            case 'strong_move':
                return { backgroundColor: '#d4edda', color: '#155724' };
            case 'brilliant':
                return { backgroundColor: '#c3e6cb', color: '#155724' };
            case 'normal':
                return { backgroundColor: '#e2e3e5', color: '#6c757d' };
            default:
                return { backgroundColor: '#e2e3e5', color: '#6c757d' };
        }
    };

    if (loading) return <p>Analyzing Positions...</p>;
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
            <Footer />
        </div>
        
    );
};

export default GameDetails;
