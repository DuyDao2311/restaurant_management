import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:8000';

let socket: Socket | null = null;

export const connectSocket = () => {
  const token = sessionStorage.getItem('access_token');
  
  if (!token) {
    console.warn('Cannot connect to socket: No access token found');
    return null;
  }

  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: {
      token: token
    }
  });

  socket.on('connect', () => {
    console.log('Socket.IO connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error.message);
  });

  socket.connect();
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
