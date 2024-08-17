import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import ChessBoard from 'chessboardjs';
import { Chess } from 'chess.js';

const ChessEvaluator = () => {
    const [games, setGames] = useState([]);
    const [username, setUsername] = useState('');
    const [currentGame, setCurrentGame] = useState(null);
    const [chess, setChess] = useState(new Chess());
    const boardRef = useRef(null);
    const location = useLocation();
    const [swingPoints, setSwingPoints] = useState([]);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username') || '';
        const storedGames = JSON.parse(localStorage.getItem('games')) || [];
        const storedCurrentGame = JSON.parse(localStorage.getItem('currentGame')) || null;

        setUsername(storedUsername);
        setGames(storedGames);
        setCurrentGame(storedCurrentGame);

        if (storedCurrentGame) {
            setChess(new Chess(storedCurrentGame.fen));
            highlightMistakes();
        }
    }, [location]); // Re-run the effect when location changes

    useEffect(() => {
        localStorage.setItem('username', username);
        localStorage.setItem('games', JSON.stringify(games));
        localStorage.setItem('currentGame', JSON.stringify(currentGame));
    }, [username, games, currentGame]);

    useEffect(() => {
        if (currentGame) {
            setupBoard();
        }

        return () => {
            if (boardRef.current) {
                boardRef.current.destroy();
                boardRef.current = null;
            }
        };
    }, [currentGame]);

    const fetchGames = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/games/${username}`);
            const fetchedGames = response.data.evaluations.map(game => ({
                ...game,
                date: game.date
            }));

            setGames(fetchedGames);
            localStorage.setItem('games', JSON.stringify(fetchedGames));
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    };

    const setupBoard = () => {
        if (boardRef.current) {
            boardRef.current.destroy();
        }

        boardRef.current = ChessBoard('board', {
            draggable: true,
            position: chess.fen(),
            onDrop: handleMove,
        });

        highlightMistakes();
    };

    const highlightMistakes = () => {
        if (!currentGame || !currentGame.evaluations) return;

        const newSwingPoints = [];
        chess.reset();

        currentGame.evaluations.forEach(({ move, swing }) => {
            if (Math.abs(swing) > 1.0) {
                chess.move(move);
                boardRef.current.position(chess.fen(), false);
                newSwingPoints.push({ move, swing, fen: chess.fen() });
            }
        });

        setSwingPoints(newSwingPoints);
    };

    const handleMove = (from, to) => {
        const move = chess.move({ from, to });
        if (move === null) return 'snapback';

        setChess(new Chess(chess.fen())); // Use a new Chess instance
        setupBoard();
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown Date';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <div className="chess-evaluator">
            <h1>Chess Game Evaluations</h1>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Chess Username"
                className="username-input"
            />
            <button onClick={fetchGames} className="submit-button">Submit</button>
            {games.length > 0 && (
                <div className="games-list">
                    {games.map((game, index) => (
                        <div key={index} className="game-card">
                            <div className="game-info">
                                <div className="player">
                                    <div className="player-square player-white"></div>
                                    <p>{game.game.white.username} <strong> - </strong> {game.game.white.rating}</p>
                                </div>
                                <div className="player">
                                    <div className="player-square player-black"></div>
                                    <p>{game.game.black.username} <strong> - </strong> {game.game.black.rating}</p>
                                </div>
                                <p><strong>Date:</strong> {formatDate(game.game.end_time)}</p>
                                <Link to={`/game/${game.id}`} state={{ game }} className="show-game-button">Show Game</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {currentGame && (
                <div className="current-game">
                    <div id="board" className="chessboard"></div>
                    <div id="moves" className="game-moves">
                        <h3>Game Moves</h3>
                        <ul>
                            {currentGame.evaluations.map((evaluation, evalIndex) => (
                                <li key={evalIndex}>
                                    Move: {evaluation.move}, Swing: {evaluation.swing}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div id="swing-points" className="swing-points">
                        <h3>Notable Swing Points</h3>
                        <ul>
                            {swingPoints.map((point, index) => (
                                <li key={index}>
                                    Move: {point.move}, Swing: {point.swing}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChessEvaluator;
