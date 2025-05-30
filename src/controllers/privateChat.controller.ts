import { Server } from 'socket.io';
import prisma from '../database/prismaClient';

export const initSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 1. Join chat room
    socket.on('join_chat', (chatId: string) => {
      socket.join(chatId);
      console.log(`User joined chat room: ${chatId}`);
    });

    // 2. Get or create chat
      socket.on('get_or_create_chat', async ({ senderId, receiverId }, callback) => {
        if (!senderId || !receiverId || senderId === receiverId) {
          return callback({ error: 'Invalid sender or receiver.' });
        }

      const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
      if (!receiver) return callback({ error: 'Receiver not found.' });

      let chat = await prisma.chat.findFirst({
        where: {
          OR: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId }
          ]
        }
      });

      if (!chat) {
        chat = await prisma.chat.create({ data: { senderId, receiverId } });
      }

      const messages = await prisma.chatMessage.findMany({
        where: { chatId: chat.id },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profilepic: true
            }
          }
        }
      });

      callback({
        chatId: chat.id,
        participants: [chat.senderId, chat.receiverId],
        messages
      });
    });

    // 3. Send message
    socket.on('send_message', async ({ chatId, content, messageType, senderId }) => {
      if (!chatId || !content || !messageType || !senderId) return;

      const message = await prisma.chatMessage.create({
        data: { chatId, senderId, content, messageType },
        include: {
          sender: {
            select: { id: true, username: true, profilepic: true }
          }
        }
      });

      io.to(chatId).emit('new_message', message);
    });

    // 4. Get messages
    socket.on('get_messages', async ({ chatId, userId }, callback) => {
      if (!chatId || !userId) return callback({ error: 'Missing chatId or userId' });

      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat) return callback({ error: 'Chat not found' });

      const isParticipant = chat.senderId === userId || chat.receiverId === userId;
      if (!isParticipant) return callback({ error: 'Unauthorized' });

      const messages = await prisma.chatMessage.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profilepic: true
            }
          }
        }
      });

      callback({ messages });
    });

    // 5. Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
