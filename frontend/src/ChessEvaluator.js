import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ChessBoard from 'chessboardjs';
import { Chess } from 'chess.js';
import Footer from './components/Footer';

const ChessEvaluator = () => {
    const [games, setGames] = useState([]);
    const [username, setUsername] = useState('');
    const [currentGame, setCurrentGame] = useState(null);
    const [chess, setChess] = useState(new Chess());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // New state for error handling
    const boardRef = useRef(null);

    useEffect(() => {
        // Initialize state from localStorage if needed
        // Instead of storing games here, fetch them directly from the server
    }, []);

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
        setLoading(true);
        setError(null); // Reset error state before fetching

        try {
            const lowercaseUsername = username.toLowerCase();
            const response = await axios.get(`http://localhost:8000/games/${lowercaseUsername}`);
            const fetchedGames = response.data.evaluations.map(game => ({
                ...game,
                date: game.date
            }));

            setGames(fetchedGames);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setError('User not found. Maybe you spelled the username wrong?');
            } else {
                console.error('Error fetching games:', error);
            }
        } finally {
            setLoading(false);
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
    };

    const handleMove = (from, to) => {
        const move = chess.move({ from, to });
        if (move === null) return 'snapback';

        setChess(new Chess(chess.fen()));
        setupBoard();
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown Date';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString();
    };

    const convertTimeControl = (timeControl) => {
        const [initialTime, increment] = timeControl.split('+');
        const [minutes, seconds] = initialTime.split(':').map(Number);
        const incrementMinutes = parseInt(increment, 10) || 0;
    
        const totalMinutes = minutes + incrementMinutes;
    
        if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const remainingMinutes = totalMinutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        } else {
            return `${totalMinutes}m`;
        }
    };
    

    return (
        <div className="chess-evaluator">
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Chess Username"
                className="username-input"
            />
            <button onClick={fetchGames} className="submit-button">Search</button>

            {loading ? (
                <div className="loading-screen">
                    <p>Chess.com user found! Analyzing games...</p>
                </div>
            ) : error ? (
                <div className="error-screen">
                    <p>Hmmm, we can't seem to find that user. Maybe you spelled it wrong?</p>
                </div>
            ) : (
                <div className="games-list">
                    {games.length > 0 && (
                        games.map((game, index) => (
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
                                    <p>{formatDate(game.game.end_time)}</p>
                                    <p>{game.game.time_class} - {convertTimeControl(game.game.time_control)} </p>
                                    <Link to={`/game/${game.id}`} state={{ game }} className="show-game-button">Show Game</Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            <Footer />
        </div>
    );
};

export default ChessEvaluator;
