import React from 'react';
import './Header.css';
import darkLogo from '../../assets/fntx_logo_dark.png';
import lightLogo from '../../assets/fntx_logo_light.png';
import { OAuthStatus } from '../OAuth';

const Header = ({ isDarkMode, toggleDarkMode }) => {
  // Use the appropriate logo based on dark/light mode
  const logo = isDarkMode ? lightLogo : darkLogo;

  return (
    <header className={`app-header ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="header-left">
        <div className="logo-container">
          <img src={logo} alt="FNTX.ai Logo" className="logo" />
        </div>
        <h1 className="site-title">fntx.ai</h1>
      </div>
      
      <div className="header-center">
        <OAuthStatus />
      </div>
      
      <div className="header-right">
        <button 
          className="theme-toggle" 
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <i className="fas fa-sun"></i>
          ) : (
            <i className="fas fa-moon"></i>
          )}
        </button>
        
        <div className="user-menu">
          <button className="user-button">
            <i className="fas fa-user"></i>
            <span>Account</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
