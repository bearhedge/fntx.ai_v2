import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Real-time Options Data Hook
export const useOptionsData = (ticker, expiry, strikeRange) => {
  const [optionsData, setOptionsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch options data
  const fetchOptionsData = async () => {
    if (!ticker) return;

    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('ticker', ticker);
      if (expiry) params.append('expiry', expiry);
      if (strikeRange) params.append('strike_range', strikeRange);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/ibkr/options-data?${params.toString()}`
      );

      setOptionsData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch options data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when parameters change
  useEffect(() => {
    fetchOptionsData();
  }, [ticker, expiry, strikeRange]);

  return { optionsData, isLoading, error, refetch: fetchOptionsData };
};

// WebSocket for Real-time Options Data
export const useOptionsDataStream = (ticker, expiry, strikeRange) => {
  const [streamData, setStreamData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!ticker) return;

    // Start streaming by making a POST request
    const startStreaming = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/ibkr/stream-options-data`, {
          ticker,
          expiry,
          strike_range: strikeRange
        });

        // After successful request, connect to WebSocket
        const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/ws/options-stream/`);
        
        ws.onopen = () => {
          setIsConnected(true);
          console.log('WebSocket connected');
          
          // Send initial message with parameters
          ws.send(JSON.stringify({
            ticker,
            expiry,
            strike_range: strikeRange
          }));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setStreamData(data);
        };
        
        ws.onerror = (event) => {
          setError('WebSocket error');
          console.error('WebSocket error:', event);
        };
        
        ws.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected');
        };
        
        setSocket(ws);
        
        // Clean up on unmount
        return () => {
          if (ws) {
            ws.close();
          }
        };
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to start streaming');
        console.error(err);
      }
    };

    startStreaming();
  }, [ticker, expiry, strikeRange]);

  // Function to manually close the connection
  const disconnect = () => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  return { streamData, isConnected, error, disconnect };
};

// Options Chain Component
export const OptionsChain = ({ ticker, expiry, strikeRange }) => {
  const { optionsData, isLoading, error } = useOptionsData(ticker, expiry, strikeRange);
  const { streamData, isConnected } = useOptionsDataStream(ticker, expiry, strikeRange);
  
  // Combine initial data with stream updates
  const displayData = streamData || optionsData;

  if (isLoading) {
    return <div className="loading">Loading options data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!displayData) {
    return <div className="no-data">No options data available</div>;
  }

  // Render the options chain
  return (
    <div className="options-chain">
      <div className="options-header">
        <h3>{ticker} Options Chain</h3>
        {expiry && <div className="expiry">Expiry: {expiry}</div>}
        <div className="connection-status">
          {isConnected ? (
            <span className="connected">Live Data</span>
          ) : (
            <span className="disconnected">Static Data</span>
          )}
        </div>
      </div>
      
      <div className="options-tables">
        <div className="row">
          <div className="col-md-5">
            <div className="table-header">Calls</div>
            <table className="table options-table">
              <thead>
                <tr>
                  <th>Strike</th>
                  <th>Last</th>
                  <th>Change</th>
                  <th>Volume</th>
                  <th>Open Int</th>
                </tr>
              </thead>
              <tbody>
                {displayData.calls?.map((call) => (
                  <tr key={`call-${call.strike}`}>
                    <td>{call.strike}</td>
                    <td>{call.lastPrice}</td>
                    <td className={call.change >= 0 ? 'positive' : 'negative'}>
                      {call.change > 0 ? '+' : ''}{call.change}
                    </td>
                    <td>{call.volume}</td>
                    <td>{call.openInterest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="col-md-2">
            <div className="table-header">Strike</div>
            <table className="table strikes-table">
              <thead>
                <tr>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {displayData.strikes?.map((strike) => (
                  <tr key={`strike-${strike}`}>
                    <td>{strike}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="col-md-5">
            <div className="table-header">Puts</div>
            <table className="table options-table">
              <thead>
                <tr>
                  <th>Strike</th>
                  <th>Last</th>
                  <th>Change</th>
                  <th>Volume</th>
                  <th>Open Int</th>
                </tr>
              </thead>
              <tbody>
                {displayData.puts?.map((put) => (
                  <tr key={`put-${put.strike}`}>
                    <td>{put.strike}</td>
                    <td>{put.lastPrice}</td>
                    <td className={put.change >= 0 ? 'positive' : 'negative'}>
                      {put.change > 0 ? '+' : ''}{put.change}
                    </td>
                    <td>{put.volume}</td>
                    <td>{put.openInterest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
