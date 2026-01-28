import prisma from './prisma.js';

export const recordAuditLog = async ({ userId, fileId, action, details, req }) => {
    try {
        const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;

        await prisma.auditLog.create({
            data: {
                userId: userId || null,
                fileId: fileId || null,
                action,
                details,
                ipAddress
            }
        });
    } catch (error) {
        console.error('Failed to record audit log:', error);
    }
};
