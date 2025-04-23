import React, { useState, useEffect } from 'react';
import axios from 'axios';

// OAuth Login Button Component
const OAuthLoginButton = () => {
  const handleLogin = () => {
    // Redirect to the backend OAuth initiation endpoint
    window.location.href = `${process.env.REACT_APP_API_URL}/ibkr/oauth/initiate`;
  };

  return (
    <button 
      className="oauth-login-btn" 
      onClick={handleLogin}
    >
      Login with Interactive Brokers
    </button>
  );
};

// OAuth Status Component
const OAuthStatus = ({ isAuthenticated, onLogout }) => {
  return (
    <div className="oauth-status">
      {isAuthenticated ? (
        <div className="authenticated">
          <span className="status-indicator connected"></span>
          <span>Connected to IBKR</span>
          <button className="logout-btn" onClick={onLogout}>Disconnect</button>
        </div>
      ) : (
        <div className="not-authenticated">
          <span className="status-indicator disconnected"></span>
          <span>Not connected to IBKR</span>
          <OAuthLoginButton />
        </div>
      )}
    </div>
  );
};

// OAuth Provider Component
const OAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/ibkr/oauth/status`);
        setIsAuthenticated(response.data.authenticated);
      } catch (err) {
        setError('Failed to check authentication status');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    
    if (authSuccess === 'success') {
      setIsAuthenticated(true);
      // Remove the query parameter from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout endpoint if needed
      // await axios.post(`${process.env.REACT_APP_API_URL}/ibkr/oauth/logout`);
      
      // For now, just clear the session on the client side
      setIsAuthenticated(false);
    } catch (err) {
      setError('Failed to logout');
      console.error(err);
    }
  };

  // Provide authentication context to children
  return (
    <div className="oauth-provider">
      {isLoading ? (
        <div className="loading">Checking authentication status...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <OAuthStatus isAuthenticated={isAuthenticated} onLogout={handleLogout} />
          {children}
        </>
      )}
    </div>
  );
};

export { OAuthProvider, OAuthLoginButton, OAuthStatus };
