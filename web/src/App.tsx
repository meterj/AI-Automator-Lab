import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        {/* Common Header */}
        <header className="header glass-card">
          <div className="container header-content">
            <div className="logo Montserrat">AI AUTOMATOR<span className="accent">LAB</span></div>
            <nav>
              <ul>
                <li><a href="/">LATEST</a></li>
                <li><a href="#">GENRES</a></li>
                <li><a href="#">ABOUT</a></li>
              </ul>
            </nav>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:id" element={<PostDetail />} />
        </Routes>

        {/* Common Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <p>© 2026 AI Automator Lab. All rights reserved.</p>
              <div className="footer-links">
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
