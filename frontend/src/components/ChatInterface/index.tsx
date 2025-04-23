import React, { useState } from 'react';
import './ChatInterface.css';
import darkLogo from '../../assets/fntx_logo_dark.png';
import lightLogo from '../../assets/fntx_logo_light.png';

// Message types
interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  options?: Option[];
  chart?: any;
  optionsChain?: any;
}

interface Option {
  text: string;
  action: string;
}

const ChatInterface = ({ isDarkMode }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      text: 'Welcome to FNTX.ai. I\'m here to help you with systematic options selling.',
      options: [
        { text: 'Select a ticker', action: 'select-ticker' },
        { text: 'View your portfolio', action: 'view-portfolio' },
        { text: 'Run analysis', action: 'run-analysis' }
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Handle sending a message
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // Simulate assistant typing
    setIsTyping(true);
    
    // Process the message and generate a response
    setTimeout(() => {
      setIsTyping(false);
      
      // Example response based on user input
      let response: Message;
      
      if (inputText.toLowerCase().includes('ticker') || inputText.toLowerCase().includes('stock')) {
        response = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: 'Please select a ticker from the list below:',
          options: [
            { text: 'AAPL - Apple Inc.', action: 'select-ticker-AAPL' },
            { text: 'MSFT - Microsoft Corp.', action: 'select-ticker-MSFT' },
            { text: 'GOOGL - Alphabet Inc.', action: 'select-ticker-GOOGL' },
            { text: 'AMZN - Amazon.com Inc.', action: 'select-ticker-AMZN' }
          ]
        };
      } else if (inputText.toLowerCase().includes('option') || inputText.toLowerCase().includes('chain')) {
        response = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: 'Here\'s the options chain for the selected ticker:',
          optionsChain: {
            ticker: 'AAPL',
            expiry: '2025-05-16'
          }
        };
      } else if (inputText.toLowerCase().includes('chart') || inputText.toLowerCase().includes('price')) {
        response = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: 'Here\'s the chart for the selected ticker:',
          chart: {
            ticker: 'AAPL',
            timeframe: '1d'
          }
        };
      } else {
        response = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: 'I\'m not sure how to respond to that. Would you like to:',
          options: [
            { text: 'Select a ticker', action: 'select-ticker' },
            { text: 'View options chain', action: 'view-options' },
            { text: 'View chart', action: 'view-chart' }
          ]
        };
      }
      
      setMessages(prev => [...prev, response]);
    }, 1500);
  };

  // Handle option selection
  const handleOptionClick = (option: Option) => {
    // Add user message based on selected option
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: option.text
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate assistant typing
    setIsTyping(true);
    
    // Process the option and generate a response
    setTimeout(() => {
      setIsTyping(false);
      
      // Example response based on selected option
      let response: Message;
      
      if (option.action.startsWith('select-ticker')) {
        const ticker = option.action.split('-')[2] || 'AAPL';
        response = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: `You've selected ${ticker}. What would you like to see?`,
          options: [
            { text: 'View options chain', action: `view-options-${ticker}` },
            { text: 'View chart', action: `view-chart-${ticker}` },
            { text: 'Run analysis', action: `run-analysis-${ticker}` }
          ]
        };
      } else if (option.action.startsWith('view-options')) {
        const ticker = option.action.split('-')[2] || 'AAPL';
        response = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: `Here's the options chain for ${ticker}:`,
          optionsChain: {
            ticker,
            expiry: '2025-05-16'
          }
        };
      } else if (option.action.startsWith('view-chart')) {
        const ticker = option.action.split('-')[2] || 'AAPL';
        response = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: `Here's the chart for ${ticker}:`,
          chart: {
            ticker,
            timeframe: '1d'
          }
        };
      } else {
        response = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: 'I\'m processing your request. What else would you like to do?',
          options: [
            { text: 'Select another ticker', action: 'select-ticker' },
            { text: 'View your portfolio', action: 'view-portfolio' },
            { text: 'Run analysis', action: 'run-analysis' }
          ]
        };
      }
      
      setMessages(prev => [...prev, response]);
    }, 1500);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className={`chat-interface ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="chat-messages" id="chatMessages">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`message ${message.type === 'user' ? 'message-user' : 'message-assistant'}`}
          >
            {message.type === 'assistant' && (
              <div className="message-avatar">
                <img 
                  src={isDarkMode ? lightLogo : darkLogo} 
                  alt="FNTX.ai" 
                  className="avatar-img"
                />
              </div>
            )}
            
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              
              {message.options && (
                <div className="message-options">
                  {message.options.map((option, index) => (
                    <button 
                      key={index} 
                      className="message-option" 
                      onClick={() => handleOptionClick(option)}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              )}
              
              {message.chart && (
                <div className="embedded-chart">
                  <div className="chart-placeholder">
                    <div className="chart-header">
                      <h4>{message.chart.ticker} Stock Chart</h4>
                      <div className="timeframe-selector">
                        <button className="btn btn-sm btn-primary">1d</button>
                        <button className="btn btn-sm btn-outline-secondary">1w</button>
                        <button className="btn btn-sm btn-outline-secondary">1m</button>
                        <button className="btn btn-sm btn-outline-secondary">3m</button>
                      </div>
                    </div>
                    <div className="chart-body">
                      {/* Chart would be rendered here in a real implementation */}
                      <div className="placeholder-text">Stock chart for {message.chart.ticker}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {message.optionsChain && (
                <div className="embedded-options-chain">
                  <div className="options-chain-placeholder">
                    <div className="options-header">
                      <h4>{message.optionsChain.ticker} Options Chain</h4>
                      <div className="expiry-selector">
                        <span>Expiry: {message.optionsChain.expiry}</span>
                      </div>
                    </div>
                    <div className="options-body">
                      {/* Options chain would be rendered here in a real implementation */}
                      <div className="placeholder-text">Options chain for {message.optionsChain.ticker}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message message-assistant">
            <div className="message-avatar">
              <img 
                src={isDarkMode ? lightLogo : darkLogo} 
                alt="FNTX.ai" 
                className="avatar-img"
              />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="chat-input-container">
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => handleOptionClick({ text: 'Select a ticker', action: 'select-ticker' })}>
            <i className="fas fa-search"></i> Select Ticker
          </button>
          <button className="quick-action-btn" onClick={() => handleOptionClick({ text: 'View options chain', action: 'view-options' })}>
            <i className="fas fa-table"></i> Options Chain
          </button>
          <button className="quick-action-btn" onClick={() => handleOptionClick({ text: 'View chart', action: 'view-chart' })}>
            <i className="fas fa-chart-line"></i> Chart
          </button>
        </div>
        
        <div className="input-group">
          <input 
            type="text" 
            id="userInput" 
            className="form-control" 
            placeholder="Type your message..." 
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="btn btn-primary" 
            id="sendButton"
            onClick={handleSendMessage}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
