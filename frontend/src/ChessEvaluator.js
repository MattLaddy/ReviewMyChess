import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ChessBoard from 'chessboardjs';
import { Chess } from 'chess.js';

const ChessEvaluator = () => {
  const [games, setGames] = useState([]);
  const [username, setUsername] = useState('');
  const [currentGame, setCurrentGame] = useState(null);
  const [chess, setChess] = useState(new Chess());
  const boardRef = useRef(null);

  useEffect(() => {
    if (currentGame) {
      setupBoard();
    }

    // Cleanup to avoid multiple instances of ChessBoard
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
      setGames(response.data.evaluations);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const setupBoard = () => {
    if (boardRef.current) {
      boardRef.current.destroy(); // Clean up the old board if it exists
    }

    boardRef.current = ChessBoard('board', {
      draggable: true,
      position: chess.fen(),
      onDrop: handleMove,
    });

    highlightMistakes();
  };

  const highlightMistakes = () => {
    currentGame.evaluations.forEach(({ move, swing }) => {
      if (Math.abs(swing) > 1.0) { // Adjust threshold as needed
        chess.move(move);
        boardRef.current.position(chess.fen(), false);
        // Add custom logic to highlight mistakes
      }
    });
  };

  const handleMove = (from, to) => {
    const move = chess.move({ from, to });
    if (move === null) return 'snapback';

    setChess(chess);
    setupBoard(); // Re-render board with the updated position
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
                <div className="player-info">
                  <p><strong>White:</strong> {game.game.white.username}   <strong>White Rating:</strong> {game.game.white.rating}</p>
                  
                  <p><strong>Black:</strong> {game.game.black.username}   <strong>Black Rating:</strong> {game.game.black.rating} 
                  
                  <button
                  onClick={() => setCurrentGame(game)}
                  className="show-game-button"
                >
                  Show Game
                </button>
                  
                  </p> 

                </div>
                
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
        </div>
      )}
    </div>
  );
};

export default ChessEvaluator;
