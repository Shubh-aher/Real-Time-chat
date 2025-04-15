import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const messageIdRef = useRef(0); // Unique key generation

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event handlers
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('message', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          ...data,
          id: `${data.socketId}-${Date.now()}-${Math.random()}`,
          isOwn: data.socketId === socket.id,
        },
      ]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message');
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && username.trim()) {
        const messageData = {
            id: `${socket.id}-${Date.now()}`,  // Ensure a unique ID
            username,
            message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            socketId: socket.id,
            isOwn: true  // Mark as own message
        };

        // Send to server
        socket.emit('message', messageData);

        // Clear input field
        setMessage('');
    }
};


  const joinChat = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.connect();
      setHasJoined(true);

      // System message for self
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          username: 'System',
          message: `You joined as ${username}`,
          isSystem: true,
          time: new Date().toLocaleTimeString(),
        },
      ]);

      socket.emit('user_joined', username);
    }
  };

  return (
    <div className="mobile-chat-app">
      {!hasJoined ? (
        <div className="join-screen">
          <div className="join-container">
            <h1>Welcome to ChatApp</h1>
            <form onSubmit={joinChat}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                required
              />
              <button type="submit">Join Chat</button>
            </form>
          </div>
        </div>
      ) : (
        <div className="chat-container">
          <div className="chat-header">
            <h2>ChatApp</h2>
            <div className="connection-status">
              <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
              {isConnected ? `Online (${username})` : 'Connecting...'}
            </div>
          </div>

          <div className="messages-container">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${
                  msg.isSystem ? 'system' : msg.isOwn ? 'sent' : 'received'
                }`}
              >
                {!msg.isSystem && <span className="sender">{msg.username}</span>}
                <div className="message-content">
                  <p>{msg.message}</p>
                  {!msg.isSystem && <span className="time">{msg.time}</span>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="message-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
              disabled={!isConnected}
            />
            <button type="submit" disabled={!isConnected || !message.trim()}>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
