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

        try {
            const lowercaseUsername = username.toLowerCase();
            const response = await axios.get(`http://localhost:8000/games/${lowercaseUsername}`);
            const fetchedGames = response.data.evaluations.map(game => ({
                ...game,
                date: game.date
            }));

            setGames(fetchedGames);
        } catch (error) {
            console.error('Error fetching games:', error);
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

    const convertTimeControlToMinutes = (timeControl) => {
        const [initialTime, increment] = timeControl.split('+');
        const [minutes, seconds] = initialTime.split(':').map(Number);
        const incrementMinutes = parseInt(increment, 10) || 0;

        const totalMinutes = minutes + incrementMinutes;
        return totalMinutes;
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
                    <p>Loading...</p>
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
                                    <p>{game.game.time_class} {convertTimeControlToMinutes(game.game.time_control)} minutes</p>
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
