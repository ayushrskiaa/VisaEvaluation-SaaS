import { createApp } from '../src/app.js';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';

await connectToDatabase();

const app = createApp();

const srv = app.listen(0, async () => {
  const port = srv.address().port;
  const base = `http://127.0.0.1:${port}`;

  const created = await fetch(`${base}/api/evaluations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Mongo Upload',
      email: 'mongoupload@example.com',
      countryCode: 'US',
      visaTypeId: 'US_O1A',
    }),
  }).then((r) => r.json());

  const id = created?.data?.id;
  // eslint-disable-next-line no-console
  console.log('created', id, 'initialScore', created?.data?.score, 'missingSuggestions', created?.data?.suggestions?.length);

  const tmpPath = path.join(process.cwd(), 'uploads', 'dummy.pdf');
  await fs.mkdir(path.dirname(tmpPath), { recursive: true });
  await fs.writeFile(tmpPath, '%PDF-1.4\n% dummy\n');

  const form = new FormData();
  form.set('documentType', 'resume');
  const blob = new Blob([await fs.readFile(tmpPath)], { type: 'application/pdf' });
  form.set('file', blob, 'dummy.pdf');

  const uploaded = await fetch(`${base}/api/evaluations/${id}/documents`, {
    method: 'POST',
    body: form,
  }).then((r) => r.json());

  // eslint-disable-next-line no-console
  console.log('afterUploadScore', uploaded?.data?.score, 'raw', uploaded?.data?.rawScore, 'missing', uploaded?.data?.missingDocuments?.length);

  const fetched = await fetch(`${base}/api/evaluations/${id}`).then((r) => r.json());
  // eslint-disable-next-line no-console
  console.log('fetchedScore', fetched?.data?.score, 'docs', fetched?.data?.documents?.length);

  srv.close(async () => {
    await disconnectFromDatabase();
  });
});
