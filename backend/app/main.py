from fastapi import FastAPI, HTTPException
import httpx
import chess.pgn
import io
import chess
import logging
import os
from fastapi.middleware.cors import CORSMiddleware
from stockfish import Stockfish

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to your Stockfish executable (use environment variable for portability)
STOCKFISH_PATH = os.getenv('STOCKFISH_PATH', "../stockfish/stockfish-macos-m1-apple-silicon")
stockfish = Stockfish(path=STOCKFISH_PATH)

def evaluate_position(fen: str, depth: int):
    logger.debug(f"Evaluating position with FEN: {fen} and depth: {depth}")
    stockfish.set_fen_position(fen)
    stockfish.set_depth(depth)
    result = stockfish.get_best_move()

    if result:
        evaluation = stockfish.get_evaluation()
        logger.debug(f"Evaluation result: {evaluation}")

        if isinstance(evaluation, dict):
            # Extract the value from the dictionary
            current_evaluation = evaluation.get('value', 0.0)
        else:
            # Handle case where evaluation is not a dictionary
            current_evaluation = evaluation
        
        return {
            "success": True,
            "evaluation": float(current_evaluation)  # Ensure it's a float
        }
    else:
        logger.error("Evaluation failed or no result returned")
        return {
            "success": False,
            "evaluation": 0.0
        }

def classify_move(swing: float) -> str:
    if swing <= -2.0:
        return "blunder"
    elif -2.0 < swing < -0.5:
        return "inaccuracy"
    elif swing >= 2.0:
        return "missed_win"
    else:
        return "normal"

def parse_pgn_and_evaluate(pgn_text: str, user_name: str, depth: int):
    logger.info("Parsing PGN and evaluating")
    evaluations = []
    previous_evaluation = 0.0

    try:
        pgn = chess.pgn.read_game(io.StringIO(pgn_text))
        board = chess.Board()
        game_data = pgn.headers
        white_player = game_data.get("White", "").strip().lower()
        black_player = game_data.get("Black", "").strip().lower()

        for move in pgn.mainline_moves():
            board.push(move)
            fen = board.fen()
            evaluation = evaluate_position(fen, depth)
            
            if evaluation and evaluation.get("success"):
                current_evaluation = evaluation.get("evaluation", 0.0)
                swing = current_evaluation - previous_evaluation

                if abs(swing) >= 1.0:
                    # Determine if the move was made by the user
                    move_player = white_player if board.turn == chess.WHITE else black_player
                    if move_player == user_name.strip().lower():
                        evaluations.append({
                            "fen": fen,
                            "move": move.uci(),
                            "previous_evaluation": previous_evaluation,
                            "current_evaluation": current_evaluation,
                            "swing": swing,
                            "classification": classify_move(swing)
                        })

                previous_evaluation = current_evaluation
            else:
                logger.error(f"Evaluation failed for FEN: {fen}")
    except ValueError as e:
        logger.error(f"ValueError during PGN parsing or evaluation: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during PGN parsing or evaluation: {e}")

    return evaluations

@app.get("/games/{username}")
async def get_games(username: str):
    logger.info(f"Fetching games for user: {username}")
    archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(archives_url)
            response.raise_for_status()
            data = response.json()

            if not data.get("archives"):
                raise HTTPException(status_code=404, detail="No archives found for the user")
            
            archive_urls = data["archives"]
            all_games = []

            for archive_url in reversed(archive_urls):
                if len(all_games) >= 10:
                    break
                
                games_response = await client.get(archive_url)
                games_response.raise_for_status()
                games_data = games_response.json()
                games = games_data.get("games", [])
                all_games.extend(games)
            
            last_10_games = all_games[:10]
            logger.info(f"Retrieved {len(last_10_games)} games")

            evaluations = []
            for game in last_10_games:
                pgn_text = game.get("pgn", "")
                depth = 10
                game_evaluations = parse_pgn_and_evaluate(pgn_text, username, depth)
                evaluations.append({
                    "game": game,
                    "evaluations": game_evaluations
                })
            
            return {"evaluations": evaluations}
        
        except httpx.HTTPStatusError as http_err:
            logger.error(f"HTTP error occurred: {http_err}")
            raise HTTPException(status_code=http_err.response.status_code, detail=str(http_err))
        except httpx.RequestError as req_err:
            logger.error(f"Request error occurred: {req_err}")
            raise HTTPException(status_code=500, detail=str(req_err))
        except ValueError as json_err:
            logger.error(f"JSON decode error: {json_err}")
            raise HTTPException(status_code=500, detail="JSON decode error")
        except Exception as e:
            logger.error(f"Unexpected error occurred: {e}")
            raise HTTPException(status_code=500, detail="Unexpected error occurred")
