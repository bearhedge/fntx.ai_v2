import React, { useState, useEffect, useRef } from 'react';
import './WebSocketManager.css';

const WebSocketManager = ({ url, onMessage, onConnect, onDisconnect, autoReconnect = true }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Connect to WebSocket
  const connect = () => {
    try {
      // Close existing connection if any
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }

      // Create new WebSocket connection
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setConnectionStatus('Connecting...');

      // Set up event handlers
      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('Connected');
        setError(null);
        if (onConnect) onConnect();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setError('Error parsing message');
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('Disconnected');
        if (onDisconnect) onDisconnect();

        // Auto reconnect if enabled
        if (autoReconnect) {
          setConnectionStatus('Reconnecting...');
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError(`Connection error: ${err.message}`);
      setConnectionStatus('Failed to connect');
    }
  };

  // Disconnect from WebSocket
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // Send message through WebSocket
  const sendMessage = (message) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    }
    return false;
  };

  // Connect on component mount
  useEffect(() => {
    connect();

    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, [url]);

  return {
    isConnected,
    connectionStatus,
    error,
    sendMessage,
    connect,
    disconnect
  };
};

export default WebSocketManager;
