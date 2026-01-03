import { createApp } from './app.js';
import { connectToDatabase } from './config/database.js';

const port = Number(process.env.PORT) || 4000;

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
