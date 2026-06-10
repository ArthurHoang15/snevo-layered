import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const ENV_FILES = ['.env', 'local.env'];

export function loadEnvironment(rootDir = process.cwd()) {
    for (const fileName of ENV_FILES) {
        const filePath = path.join(rootDir, fileName);
        if (fs.existsSync(filePath)) {
            dotenv.config({ path: filePath });
        }
    }
}

loadEnvironment();
