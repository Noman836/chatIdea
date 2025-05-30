// // webSocket.ts
// import { Server as SocketIOServer, Socket } from 'socket.io';

// let io: SocketIOServer;

// export function setupSocketIO(server: any) {
//   io = new SocketIOServer(server, {
//     cors: {
//       origin: '*',
//       methods: ['GET', 'POST'],
//     },
//   });

//   io.on('connection', (socket: Socket) => {
//     console.log('New client connected:', socket.id);
//     socket.on('join_chat', (chatId: string) => {
//       console.log(`Socket ${socket.id} joining chat ${chatId}`);
//       socket.join(chatId);
//     });

//     socket.on('disconnect', () => {
//       console.log('Client disconnected:', socket.id);
//     });
//   });

//   return io;
// }

// // ✅ Getter to safely access io
// export function getIO() {
//   if (!io) {
//     throw new Error('Socket.io not initialized');
//   }
//   return io;
// }
