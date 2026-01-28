import express from 'express';
import multer from 'multer';
import { uploadFile, listFiles, downloadFile, deleteFile } from '../controllers/fileController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
// Use memory storage to get buffer for encryption
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', listFiles);
router.get('/:id/download', downloadFile);
router.delete('/:id', deleteFile);

export default router;
