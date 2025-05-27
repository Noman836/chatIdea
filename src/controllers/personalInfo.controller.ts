import { Request, Response } from 'express';
import prisma from '../database/prismaClient';
import cloudinary from 'cloudinary';
import getBuffer from '../utils/dataUri';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
  file?: Express.Multer.File;
}

export const createProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { username, fullname } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!file) {
      return res.status(400).json({ message: "Please select a file" });
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer.content) {
      return res.status(500).json({ message: "Failed to generate file buffer" });
    }

    // Upload image to Cloudinary
    const cloud = await cloudinary.v2.uploader.upload(fileBuffer.content, {
      folder: 'profile',
    });

    const profilepic = cloud.secure_url;

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        fullname,
        profilepic,
      },
    });

    // Return updated user
    return res.status(201).json({
      message: 'Profile Created successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error creating wallet:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
