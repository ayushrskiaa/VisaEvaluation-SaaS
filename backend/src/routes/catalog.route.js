import express from 'express';

import {
  getCountries,
  getVisaTypeById,
  getVisaTypesByCountryCode,
} from '../data/visaCatalog.data.js';

export const catalogRouter = express.Router();

catalogRouter.get('/countries', (_req, res) => {
  res.json({ success: true, data: getCountries() });
});

catalogRouter.get('/countries/:code/visas', (req, res) => {
  const visas = getVisaTypesByCountryCode(req.params.code);
  if (!visas) return res.status(404).json({ success: false, error: 'Country not found' });
  return res.json({ success: true, data: visas });
});

catalogRouter.get('/visas/:visaTypeId', (req, res) => {
  const visa = getVisaTypeById(req.params.visaTypeId);
  if (!visa) return res.status(404).json({ success: false, error: 'Visa type not found' });
  return res.json({ success: true, data: visa });
});

catalogRouter.get('/visas/:visaTypeId/requirements', (req, res) => {
  const visa = getVisaTypeById(req.params.visaTypeId);
  if (!visa) return res.status(404).json({ success: false, error: 'Visa type not found' });
  return res.json({
    success: true,
    data: {
      visaTypeId: visa.id,
      requiredDocuments: visa.requiredDocuments,
    },
  });
});
