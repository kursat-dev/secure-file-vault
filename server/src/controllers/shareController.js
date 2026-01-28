import prisma from '../utils/prisma.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { recordAuditLog } from '../utils/audit.js';
import { decryptFile } from '../utils/encryption.js';

export const createShareLink = async (req, res) => {
    try {
        const { fileId, password, expiresHours } = req.body;
        const userId = req.user.userId;

        // Verify file ownership
        const file = await prisma.file.findFirst({
            where: { id: fileId, userId }
        });

        if (!file) {
            return res.status(404).json({ error: 'File not found or unauthorized' });
        }

        const shareKey = crypto.randomBytes(16).toString('hex');
        let passwordHash = null;
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        let expiresAt = null;
        if (expiresHours) {
            expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + parseInt(expiresHours));
        }

        const share = await prisma.sharedLink.create({
            data: {
                fileId,
                shareKey,
                passwordHash,
                expiresAt
            }
        });

        await recordAuditLog({
            userId,
            fileId,
            action: 'SHARE_LINK_CREATED',
            details: `Created share link: ${shareKey}`,
            req
        });

        res.json({
            shareKey,
            expiresAt,
            hasPassword: !!password
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create share link' });
    }
};

export const getShareInfo = async (req, res) => {
    try {
        const { shareKey } = req.params;

        const share = await prisma.sharedLink.findUnique({
            where: { shareKey },
            include: { file: { select: { originalName: true, size: true, mimeType: true } } }
        });

        if (!share) {
            return res.status(404).json({ error: 'Link not found' });
        }

        if (share.expiresAt && share.expiresAt < new Date()) {
            return res.status(410).json({ error: 'Link expired' });
        }

        res.json({
            originalName: share.file.originalName,
            size: share.file.size,
            mimeType: share.file.mimeType,
            hasPassword: !!share.passwordHash,
            expiresAt: share.expiresAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get share info' });
    }
};

export const accessSharedFile = async (req, res) => {
    try {
        const { shareKey } = req.params;
        const { password } = req.body;

        const share = await prisma.sharedLink.findUnique({
            where: { shareKey },
            include: { file: true }
        });

        if (!share) {
            return res.status(404).json({ error: 'Link not found' });
        }

        if (share.expiresAt && share.expiresAt < new Date()) {
            return res.status(410).json({ error: 'Link expired' });
        }

        if (share.passwordHash) {
            if (!password) {
                return res.status(401).json({ error: 'Password required' });
            }
            const match = await bcrypt.compare(password, share.passwordHash);
            if (!match) {
                return res.status(401).json({ error: 'Invalid password' });
            }
        }

        // Increment access count
        await prisma.sharedLink.update({
            where: { id: share.id },
            data: { accessCount: { increment: 1 } }
        });

        await recordAuditLog({
            fileId: share.fileId,
            action: 'SHARE_LINK_ACCESSED',
            details: `Accessed via link: ${shareKey}`,
            req
        });

        // We return the file metadata and a temporary "access token" or just the decryption info?
        // Since the client needs to download and decrypt, we need to send the decryption info.
        // GCM parameters are needed.

        res.json({
            fileId: share.file.id,
            originalName: share.file.originalName,
            mimeType: share.file.mimeType,
            downloadUrl: `/sharing/download/${shareKey}` // Client will use this next
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to access shared file' });
    }
};

export const downloadSharedFile = async (req, res) => {
    try {
        const { shareKey } = req.params;
        const { password } = req.query; // PWD in query for GET download

        const share = await prisma.sharedLink.findUnique({
            where: { shareKey },
            include: { file: true }
        });

        if (!share) return res.status(404).json({ error: 'Link not found' });
        if (share.expiresAt && share.expiresAt < new Date()) return res.status(410).json({ error: 'Link expired' });

        if (share.passwordHash) {
            if (!password) return res.status(401).json({ error: 'Password required' });
            const match = await bcrypt.compare(password, share.passwordHash);
            if (!match) return res.status(401).json({ error: 'Invalid password' });
        }

        const UPLOAD_DIR = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : 'uploads';
        const filePath = path.join(UPLOAD_DIR, share.file.encryptedName);
        const encryptedContent = await fs.readFile(filePath);

        const decryptedBuffer = decryptFile(
            encryptedContent,
            share.file.iv,
            share.file.authTag,
            share.file.encryptedKey,
            process.env.MASTER_KEY
        );

        await recordAuditLog({
            fileId: share.fileId,
            action: 'SHARE_LINK_DOWNLOADED',
            details: `Downloaded via link: ${shareKey}`,
            req
        });

        res.setHeader('Content-Disposition', `attachment; filename="${share.file.originalName}"`);
        res.setHeader('Content-Type', share.file.mimeType);
        res.send(decryptedBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Download failed' });
    }
};
