import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express'
const connectDatabase = require('./config/database');
import apiRoutes from './routes/index';
const { errorHandler: errorMiddleware } = require('./middleware/error.middleware');
const { notFoundMiddleware } = require('./middleware/notFound.middleware');
const { securityMiddleware, securityHeaders } = require('./middleware/security.middleware');


dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});
app.use(clerkMiddleware())

// Conectar ao banco de dados
connectDatabase();

// Middleware de segurança
app.use(securityMiddleware);
app.use(securityHeaders);

// Middleware básico
app.use(morgan('combined'));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rotas da API
app.use('/api', apiRoutes);

// Socket.io para real-time tracking
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('joinDelivery', (deliveryId) => {
    socket.join(`delivery_${deliveryId}`);
    console.log(`User ${socket.id} joined delivery ${deliveryId}`);
  });
  
  socket.on('updateLocation', (data) => {
    socket.to(`delivery_${data.deliveryId}`).emit('locationUpdate', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Middleware de erro (deve ser o último)
app.use(notFoundMiddleware);
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Etchi API running on port ${PORT}`);
  console.log(`📚 Swagger docs available at http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export { app, io };