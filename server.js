const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log("User connected:", socket.id);

  socket.on('user_joined', (username) => {
    console.log(`${username} joined the chat`);
    // Notify all other users
    socket.broadcast.emit('message', {
      username: 'System',
      message: `${username} joined the chat`,
      isSystem: true,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('message', (data) => {
    console.log('Message received from:', data.username);
    io.emit('message', {
      ...data,
      time: data.time || new Date().toLocaleTimeString()
    });
  });
  

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));