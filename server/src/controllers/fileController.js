import prisma from '../utils/prisma.js';
import fs from 'fs/promises';
import path from 'path';
import { encryptFile, decryptFile } from '../utils/encryption.js';

import os from 'os';

const UPLOAD_DIR = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : 'uploads';

// Ensure upload dir exists
(async () => {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (e) { }
})();

export const uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const { originalname, mimetype, buffer, size } = req.file;
        const masterKey = process.env.MASTER_KEY;

        // Encrypt the file
        const { encryptedContent, iv, authTag, encryptedKey } = encryptFile(buffer, masterKey);
        // Note: buffer is available because valid multer logic (memory storage)

        // Generate unique filename for storage
        const encryptedFilename = `${Date.now()}-${crypto.randomUUID()}.enc`;
        const filePath = path.join(UPLOAD_DIR, encryptedFilename);

        // Write encrypted content to disk
        await fs.writeFile(filePath, encryptedContent);

        // Store metadata in DB
        const file = await prisma.file.create({
            data: {
                userId: req.user.userId,
                originalName: originalname,
                encryptedName: encryptedFilename,
                mimeType: mimetype,
                size: size,
                iv: iv,
                authTag: authTag,
                encryptedKey: encryptedKey,
            },
        });

        res.status(201).json(file);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload failed' });
    }
};

export const listFiles = async (req, res) => {
    try {
        const files = await prisma.file.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'List failed' });
    }
};

export const downloadFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const file = await prisma.file.findUnique({ where: { id: fileId } });

        if (!file) return res.status(404).json({ error: 'File not found' });
        if (file.userId !== req.user.userId) return res.status(403).json({ error: 'Access denied' });

        const filePath = path.join(UPLOAD_DIR, file.encryptedName);
        const encryptedContent = await fs.readFile(filePath);

        const decryptedBuffer = decryptFile(
            encryptedContent,
            file.iv,
            file.authTag,
            file.encryptedKey,
            process.env.MASTER_KEY
        );

        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimeType);
        res.send(decryptedBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Download failed' });
    }
};
