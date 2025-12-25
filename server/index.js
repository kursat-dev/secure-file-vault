import fs from 'fs';
import path from 'path';
import os from 'os';

// Vercel Serverless Entry Point
// This needs to handle the Ephemeral filesystem limitations

// 1. Setup Database in /tmp
if (process.env.VERCEL) {
    const tmpDbPath = path.join(os.tmpdir(), 'prod.db');
    const templateDbPath = path.join(process.cwd(), 'server/prisma/template.db');

    // Set the env var BEFORE loading the app/prisma
    process.env.DATABASE_URL = `file:${tmpDbPath}`;

    if (!fs.existsSync(tmpDbPath)) {
        console.log('Initializing Vercel /tmp database...');
        // In a real Vercel function, CWD might be different, let's try to locate template
        // We expect 'server/prisma/template.db' to be available because of vercel.json includeFiles
        try {
            if (fs.existsSync(templateDbPath)) {
                fs.copyFileSync(templateDbPath, tmpDbPath);
                console.log('Database template copied to /tmp/prod.db');
            } else {
                console.error('Template DB not found at:', templateDbPath);
                // Fallback: create empty file? Prisma might fail.
            }
        } catch (e) {
            console.error('Failed to copy DB template:', e);
        }
    }
}

// 2. Dynamic import of the app ensures env vars are set first
const appModule = await import('./src/server.js');
export default appModule.default;
