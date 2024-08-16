import React from 'react';
import './Footer.css';

const Footer = () => (
    <footer className="footer">
        <p>© {new Date().getFullYear()} Your Company. All rights reserved.</p>
        <p>
            <a href="/privacy">Privacy Policy</a> | <a href="/terms">Terms of Service</a>
        </p>
    </footer>
);

export default Footer;
