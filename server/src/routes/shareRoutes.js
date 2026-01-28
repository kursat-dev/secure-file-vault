import express from 'express';
import { createShareLink, getShareInfo, accessSharedFile, downloadSharedFile } from '../controllers/shareController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes for share links
router.get('/info/:shareKey', getShareInfo);
router.post('/access/:shareKey', accessSharedFile);
router.get('/download/:shareKey', downloadSharedFile);

// Protected routes for creating share links
router.post('/create', authenticateToken, createShareLink);

export default router;
