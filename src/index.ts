import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import bodyParser from 'body-parser';

import cloudinary from 'cloudinary';
import { rateLimiter } from './middleware/rate-limiter';

import routeEmail from './routes/email.routes';
import walletRoute from './routes/wallet.routes';
import profileRoute from './routes/profile.routes';
import passwordRoute from './routes/password.routes';

import { Server as SocketIOServer } from 'socket.io';
import { initSocket } from './controllers/privateChat.controller';

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type'],
}));

// Middleware Setup
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(rateLimiter);

// Cloudinary Configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// REST API Routes
app.use('/api/user', routeEmail);
app.use('/api/wallet', walletRoute);
app.use('/api/profile', profileRoute);
app.use('/api/password', passwordRoute);

// Create Socket.IO server with CORS config
const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize socket event handlers
initSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
