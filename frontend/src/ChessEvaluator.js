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
    const [loading, setLoading] = useState(false);
    const boardRef = useRef(null);
    const location = useLocation();
    const [swingPoints, setSwingPoints] = useState([]);

    // Initialize state from localStorage
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
    }, [location]); // Re-run effect when location changes

    // Update localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem('username', username);
        localStorage.setItem('games', JSON.stringify(games));
        localStorage.setItem('currentGame', JSON.stringify(currentGame));
    }, [username, games, currentGame]);

    // Setup the chessboard when the current game changes
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

    // Fetch games data from the API
    const fetchGames = async () => {
        setLoading(true); // Set loading to true before starting the fetch

        // Clear previous data
        setGames([]);
        setCurrentGame(null);

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
        } finally {
            setLoading(false); // Set loading to false after fetching is complete
        }
    };

    // Initialize and setup the chessboard
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

    // Highlight mistakes and notable swing points
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

    // Handle moves on the chessboard
    const handleMove = (from, to) => {
        const move = chess.move({ from, to });
        if (move === null) return 'snapback';

        setChess(new Chess(chess.fen())); // Update chess instance
        setupBoard();
    };

    // Format timestamp into a readable date string
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown Date';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString();
    };

    const convertTimeControlToMinutes = (timeControl) => {
        const seconds = parseInt(timeControl, 10);
        if (isNaN(seconds)) {
            throw new Error('Invalid time control value');
        }
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
    
        return `${minutes} min`;
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
        
        
        

            {/* Conditional rendering for loading and data */}
            {loading ? (
                <div className="loading-screen">
                    <p>Loading...</p>
                </div>
            ) : (
                <>
                <div className="top">
                    <div className="tops">White</div>
                    <div className="tops">Black</div>
                    <div className="tops">Date</div>
                    <div className="tops">Control</div>
                </div>
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
                                        <p>{formatDate(game.game.end_time)}</p>
                                        <p>{game.game.time_class} {convertTimeControlToMinutes(game.game.time_control)}</p>
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
                </>
            )}
        </div>
    );
};

export default ChessEvaluator;
