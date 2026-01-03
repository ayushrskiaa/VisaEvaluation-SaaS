export const visaCatalog = {
  countries: [
    {
      code: 'US',
      name: 'United States',
      visaTypes: [
        {
          id: 'US_O1A',
          name: 'O-1A (Extraordinary Ability)',
          requiredDocuments: ['resume'],
        },
        {
          id: 'US_O1B',
          name: 'O-1B (Extraordinary Ability - Arts)',
          requiredDocuments: ['resume'],
        },
        {
          id: 'US_H1B',
          name: 'H-1B (Specialty Occupation)',
          requiredDocuments: ['resume'],
        },
      ],
    },
    {
      code: 'IE',
      name: 'Ireland',
      visaTypes: [
        {
          id: 'IE_CSEP',
          name: 'Critical Skills Employment Permit',
          requiredDocuments: ['resume'],
        },
      ],
    },
    {
      code: 'PL',
      name: 'Poland',
      visaTypes: [
        {
          id: 'PL_WPC',
          name: 'Work Permit Type C',
          requiredDocuments: ['resume'],
        },
      ],
    },
    {
      code: 'FR',
      name: 'France',
      visaTypes: [
        {
          id: 'FR_TALENT_PASSPORT',
          name: 'Talent Passport',
          requiredDocuments: ['resume'],
        },
        {
          id: 'FR_SALARIE_MISSION',
          name: 'Salarié en Mission',
          requiredDocuments: ['resume'],
        },
      ],
    },
    {
      code: 'NL',
      name: 'Netherlands',
      visaTypes: [
        {
          id: 'NL_KM',
          name: 'Knowledge Migrant Permit',
          requiredDocuments: ['resume'],
        },
      ],
    },
    {
      code: 'DE',
      name: 'Germany',
      visaTypes: [
        {
          id: 'DE_EU_BLUE_CARD',
          name: 'EU Blue Card',
          requiredDocuments: ['resume'],
        },
        {
          id: 'DE_ICT',
          name: 'ICT Permit',
          requiredDocuments: ['resume'],
        },
      ],
    },
  ],
};

export function getCountries() {
  return visaCatalog.countries.map(({ visaTypes, ...country }) => ({
    ...country,
    visaTypeCount: visaTypes.length,
  }));
}

export function getVisaTypesByCountryCode(countryCode) {
  const country = visaCatalog.countries.find((c) => c.code === countryCode);
  return country?.visaTypes ?? null;
}

export function getVisaTypeById(visaTypeId) {
  for (const country of visaCatalog.countries) {
    const visaType = country.visaTypes.find((v) => v.id === visaTypeId);
    if (visaType) return { ...visaType, countryCode: country.code, countryName: country.name };
  }
  return null;
}
