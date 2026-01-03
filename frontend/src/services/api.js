import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const visaApi = {
  // Catalog
  getCountries: () => api.get('/countries').then((res) => res.data),
  getVisasByCountry: (countryCode) => api.get(`/countries/${countryCode}/visas`).then((res) => res.data),
  getVisaDetails: (visaTypeId) => api.get(`/visas/${visaTypeId}`).then((res) => res.data),

  // Evaluations
  createEvaluation: (data) => api.post('/evaluations', data).then((res) => res.data),
  getEvaluation: (id) => api.get(`/evaluations/${id}`).then((res) => res.data),
  evaluateSubmission: (id) => api.post(`/evaluations/${id}/evaluate`).then((res) => res.data),

  // Documents
  uploadDocument: (id, documentType, file) => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    return api
      .post(`/evaluations/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
};
