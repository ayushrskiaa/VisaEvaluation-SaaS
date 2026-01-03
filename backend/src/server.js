import { createApp } from './app.js';
import { connectToDatabase } from './config/database.js';
import fs from 'node:fs';
import path from 'node:path';

const port = Number(process.env.PORT) || 4000;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Ensure storage directory exists
const storageDir = path.join(process.cwd(), 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
  console.log('✅ Created storage directory');
}

const app = createApp();

connectToDatabase()
  .then((info) => {
    // eslint-disable-next-line no-console
    console.log(info.enabled ? 'MongoDB: enabled' : `MongoDB: disabled (${info.reason})`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection failed:', err?.message ?? err);
  });

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});
