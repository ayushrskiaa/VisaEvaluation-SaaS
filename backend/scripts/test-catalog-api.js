import { createApp } from '../src/app.js';

const app = createApp();

const srv = app.listen(0, async () => {
  const port = srv.address().port;
  const base = `http://127.0.0.1:${port}`;

  const countries = await fetch(`${base}/api/countries`).then((r) => r.json());
  const usVisas = await fetch(`${base}/api/countries/US/visas`).then((r) => r.json());

  // eslint-disable-next-line no-console
  console.log('countries', countries.data?.length);
  // eslint-disable-next-line no-console
  console.log('usVisas', usVisas.data?.length);

  srv.close();
});
