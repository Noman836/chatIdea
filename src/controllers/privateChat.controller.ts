// sockets/initSocket.ts
import { Server } from 'socket.io';
import prisma from '../database/prismaClient';
import { verifyToken } from '../utils/jwt';

export const initSocket = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: Token missing'));

    try {
      const decoded = verifyToken(token);
      socket.data.userId = decoded?.id;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log('User connected:', userId);

    // 1-on-1 CHAT
    socket.on('join_chat', (chatId: string) => {
      socket.join(chatId);
    });

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
            { senderId: receiverId, receiverId: senderId },
          ],
        },
      });

      if (!chat) {
        chat = await prisma.chat.create({ data: { senderId, receiverId } });
      }

      const messages = await prisma.chatMessage.findMany({
        where: { chatId: chat.id },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, username: true, profilepic: true } },
        },
      });

      callback({
        chatId: chat.id,
        participants: [chat.senderId, chat.receiverId],
        messages,
      });
    });

    socket.on('send_message', async ({ chatId, content, messageType, senderId }) => {
      if (!chatId || !content || !messageType || !senderId) return;

      const message = await prisma.chatMessage.create({
        data: { chatId, senderId, content, messageType },
        include: {
          sender: { select: { id: true, username: true, profilepic: true } },
        },
      });

      io.to(chatId).emit('new_message', message);
    });

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
            select: { id: true, username: true, profilepic: true },
          },
        },
      });

      callback({ messages });
    });

    // GROUP CHAT LOGIC — NEW & BASED ON SCHEMA
    socket.on('create_group', async ({ name, description, participantIds }, callback) => {
      try {
        const creatorId = socket.data.userId as string;
        const group = await prisma.group.create({
          data: {
            name,
            description,
            createdBy: creatorId,
          },
        });

        const members = Array.from(new Set([...participantIds, creatorId]));
        for (const userId of members) {
          await prisma.groupMember.create({
            data: {
              groupId: group.id,
              userId,
            },
          });
        }

        callback({ success: true, groupId: group.id });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });

    // NEW improved joined_group event
    socket.on('joined_group', async ({ groupId }, callback) => {
      try {
        const userId = socket.data.userId;
        if (!userId) throw new Error('User not authenticated');

        // Check if user is a member of the group
        const membership = await prisma.groupMember.findFirst({
          where: {
            groupId,
            userId,
          },
        });

        if (!membership) {
          return callback({ success: false, error: 'User is not a member of the group' });
        }

        // Join the socket.io room for the group
        socket.join(groupId);

        // console.log(`User ${userId} joined group ${groupId}`);

        // Notify other group members
        socket.to(groupId).emit('user_joined_group', {
          userId,
          message: `User ${userId} has joined the group`,
        });

        callback({ success: true });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });

    socket.on('send_group_message', async ({ groupId, content, messageType }, callback) => {
      try {
        const senderId = socket.data.userId;
        // console.log(`[send_group_message] Received from client → groupId: ${groupId}, content: ${content}, type: ${messageType}, senderId: ${senderId}`);/

        const message = await prisma.groupMessage.create({
          data: {
            groupId,
            senderId,
            content,
            messageType,
          },
          include: {
            sender: { select: { id: true, username: true, profilepic: true } },
          },
        });

        // console.log(`[send_group_message] Message saved. Emitting to group ${groupId}:`, message);

        io.to(groupId).emit('new_group_message', message);
        callback?.({ success: true });
      } catch (err: any) {
        console.error('[send_group_message] Error:', err.message);
        callback?.({ success: false, error: err.message });
      }
    });


    socket.on('get_group_messages', async ({ groupId }, callback) => {
      try {
        const messages = await prisma.groupMessage.findMany({
          where: { groupId },
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                profilepic: true, // This comes from `users` table
              },
            },
          },
        });
        // console.log("messages:", messages);

        callback({ messages });
      } catch (err: any) {
        callback({ error: err.message });
      }
    });

 socket.on('add_participants', async ({ groupId, newParticipantIds }, callback) => {
  try {
    // console.log(`[add_participants] Adding to group ${groupId}:`, newParticipantIds);

    for (const userId of newParticipantIds) {
      await prisma.groupMember.create({
        data: {
          groupId,
          userId,
        },
      });
      // console.log(`[add_participants] Added userId: ${userId} to group: ${groupId}`);
    }

    callback({ success: true });
  } catch (err: any) {
    console.error('[add_participants] Error:', err.message);
    callback({ success: false, error: err.message });
  }
});
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
