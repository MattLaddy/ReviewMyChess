import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ChessEvaluator from './ChessEvaluator';
import GameDetails from './GameDetails';
import Header from './components/Header';
import Footer from './components/Footer';
import './styles/ChessEvaluator.css';

function App() {
    return (
        <Router>
            <Header />
            <div className="container">
                <Routes>
                    <Route path="/" element={<ChessEvaluator />} />
                    <Route path="/game/:id" element={<GameDetails />} />
                </Routes>
            </div>
            <Footer />
        </Router>
    );
}

export default App;
