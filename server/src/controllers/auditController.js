import prisma from '../utils/prisma.js';

export const getAuditLogs = async (req, res) => {
    try {
        const userId = req.user.userId;

        const logs = await prisma.auditLog.findMany({
            where: {
                OR: [
                    { userId },
                    { file: { userId } }
                ]
            },
            include: {
                file: {
                    select: {
                        originalName: true
                    }
                },
                user: {
                    select: {
                        email: true
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: 50
        });

        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
};
