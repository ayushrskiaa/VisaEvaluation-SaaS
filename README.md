# 🌍 Multi-Country Visa Evaluation Tool

A comprehensive visa evaluation platform that helps users assess their eligibility for various visa types across multiple countries.

## 📋 Assignment Requirements Met

✅ **Multi-Country Support** - 6 countries (US, Ireland, Poland, France, Netherlands, Germany)  
✅ **Multiple Visa Types** - 10+ visa categories including O-1A, H-1B, Critical Skills Permit, EU Blue Card, etc.  
✅ **User Input Collection** - Name, email, country/visa selection, document uploads  
✅ **Evaluation Scoring** - 0-100 scale with configurable 85% cap  
✅ **Storage** - MongoDB when available, JSON fallback when not  
✅ **Results Display** - Score visualization with summaries and suggestions  
✅ **Modern Stack** - React + Tailwind (frontend), Node.js + Express (backend)  
✅ **AI Integration** - Gemini support (API key required for AI-only evaluation)

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
```

Backend runs on: http://localhost:4000

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on: http://localhost:5173

## 📁 Project Structure

```
backend/
├── src/
│   ├── models/          # MongoDB schemas (Evaluation, Partner)
│   ├── routes/          # API endpoints
│   │   ├── catalogRoutes.js      # Countries & visa types
│   │   ├── evaluationRoutes.js   # Create & retrieve evaluations
│   │   ├── uploadRoutes.js       # Document upload & auto-scoring
│   │   └── partnerRoutes.js      # Partner API & dashboard
│   ├── services/
│   │   ├── evaluationEngine.js   # Scoring logic
│   │   └── ai.service.js         # Gemini integration
│   ├── config/          # Database configuration
│   ├── data/            # Visa catalog data
│   ├── app.js           # Express app setup
│   └── server.js        # Server entrypoint
├── scripts/             # Test & demo scripts
└── uploads/             # Document storage

frontend/
├── src/
│   ├── components/      # React components
│   │   ├── ProgressStepper.jsx
│   │   ├── UserInfoForm.jsx
│   │   ├── CountryVisaSelector.jsx
│   │   ├── DocumentUpload.jsx
│   │   └── ResultsDashboard.jsx
│   ├── pages/           # Page components
│   │   ├── HomePage.jsx
│   │   └── EvaluationPage.jsx
│   ├── services/        # API client
│   └── App.jsx          # Router setup
```

## 🎯 Core Features

### 1. Multi-Country Visa Catalog
- **6 Countries**: United States, Ireland, Poland, France, Netherlands, Germany
- **10+ Visa Types**: Each with specific document requirements
- **Data-Driven**: Easy to add new countries/visas via configuration

### 2. Document Upload & Validation
- **File Types**: PDF, DOC, DOCX, PNG, JPEG
- **Size Limit**: 5MB per file
- **Validation**: Mime type and size checks
- **Auto-Scoring**: Evaluation updates after each upload

### 3. Evaluation Scoring System
- **0-100 Scale**: Based on document completeness
- **85% Cap**: Configurable maximum score (realistic expectations)
- **AI-Enhanced**: Gemini generates personalized summaries
- **Fallback Logic**: Works perfectly without AI

### 4. Partner Integration
- **API Key Authentication**: x-api-key header support
- **Usage Tracking**: Automatic evaluation count per partner
- **Statistics API**: Total evaluations, average score, by-country breakdown
- **Dashboard Ready**: Endpoints for partner portal

### 5. User Experience
- **Multi-Step Flow**: 4-step guided process
  1. Enter personal info (name, email)
  2. Select country and visa type
  3. Upload required documents
  4. View results with recommendations
- **Real-Time Feedback**: Instant validation and progress tracking
- **Responsive Design**: Works on desktop and mobile
- **Professional UI**: Clean Tailwind CSS styling

## 🔌 API Endpoints

### Catalog APIs
```
GET  /api/countries                    # List all countries
GET  /api/countries/:code/visas        # Get visas for country
GET  /api/visas/:id                    # Get visa details
```

### Evaluation APIs
```
POST /api/evaluations                  # Create new evaluation
GET  /api/evaluations/:id              # Get evaluation by ID
POST /api/evaluations/:id/evaluate     # Re-run evaluation
POST /api/evaluations/:id/documents    # Upload document
```

### Partner APIs
```
POST /api/partners                     # Create partner (admin)
GET  /api/partners                     # List all partners (admin)
GET  /api/partners/me                  # Get partner details (requires x-api-key)
GET  /api/partners/evaluations         # List partner's evaluations
GET  /api/partners/stats               # Get partner statistics
```

## 🧪 Testing

### Test Scripts
```bash
cd backend

# Comprehensive verification (works with JSON fallback)
node scripts/verify-all-features.js

# Test catalog APIs
node scripts/test-catalog-api.js

# Test evaluation APIs
node scripts/test-evaluation-api.js

# Test full upload & evaluation flow
node scripts/test-full-evaluation-flow.js

# Test AI integration (requires GEMINI_API_KEY)
node scripts/test-ai-integration.js
```

### Manual Testing
1. Start backend: `npm run dev` in backend/
2. Start frontend: `npm run dev` in frontend/
3. Visit http://localhost:5173
4. Complete evaluation flow
5. Check MongoDB for saved data

## 🔑 Environment Variables

### Backend (.env)
```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/visa-eval
MAX_SCORE_CAP=85
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=your_model_name_here
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:4000
```

## 💡 Key Design Decisions

### 1. Data-Driven Visa Catalog
Instead of hardcoding visa logic, we use a configuration-based approach in `visaCatalog.js`. This makes it easy to:
- Add new countries/visas without code changes
- Update document requirements
- Maintain consistency across the app

### 2. Auto-Scoring on Upload
Each document upload triggers automatic evaluation:
- Immediate feedback to users
- No separate "calculate" button needed
- Always up-to-date scores

### 3. Configurable Score Cap
The 85% maximum reflects realistic visa success rates:
- Sets proper expectations
- Encourages thorough preparation
- Adjustable via environment variable

### 4. AI with Fallback
Gemini integration:
- Enhanced: Personalized AI-generated summaries
- Fallback: Professional rule-based summaries
- No functionality lost either way

### 5. Partner API Design
Simple but powerful partner integration:
- HTTP header authentication (x-api-key)
- Automatic tracking
- Ready for SaaS model

## 🎨 Supported Visa Types

### United States
- O-1A (Extraordinary Ability - Arts/Sciences)
- O-1B (Extraordinary Ability - Entertainment)
- H-1B (Specialty Occupation)

### Ireland
- Critical Skills Employment Permit
- General Employment Permit

### Poland
- Work Permit Type A
- Work Permit Type C

### France
- Talent Passport
- Salarié en Mission

### Netherlands
- Knowledge Migrant Permit
- ICT Permit

### Germany
- EU Blue Card
- ICT Permit

## 🚧 Future Enhancements

### Short-Term
- Email notifications (Nodemailer)
- PDF report generation
- Document preview

### Medium-Term
- Multi-language support
- Partner dashboard UI
- Advanced analytics

### Long-Term
- AI document review
- Real-time chat support
- Mobile app

## 📊 Database Schema

### Evaluation Collection
```javascript
{
  name: String,
  email: String,
  countryCode: String,
  visaTypeId: String,
  documents: [{
    documentType: String,
    originalName: String,
    storagePath: String,
    mimeType: String,
    sizeBytes: Number,
    uploadedAt: Date
  }],
  rawScore: Number,
  score: Number,
  scoreCap: Number,
  summary: String,
  suggestions: [String],
  partnerKey: String,
  createdAt: Date
}
```

### Partner Collection
```javascript
{
  name: String,
  apiKey: String,
  email: String,
  website: String,
  isActive: Boolean,
  evaluationCount: Number,
  createdAt: Date,
  lastUsed: Date
}
```

## 🛡️ Security Considerations

- ✅ Input validation with Zod schemas
- ✅ File type validation
- ✅ File size limits (5MB)
- ✅ MongoDB ObjectId validation
- ✅ CORS configured
- ✅ Environment variables for secrets
- ⚠️ Production: Add rate limiting
- ⚠️ Production: Add authentication
- ⚠️ Production: Use cloud storage for files

## 📝 Development Notes

### Code Quality
- ES modules throughout (import/export)
- Async/await for all async operations
- Comprehensive error handling
- Clear variable/function names
- Modular architecture

### Testing Approach
- Smoke tests for all major flows
- Manual end-to-end testing
- MongoDB integration tests
- API endpoint verification

### Performance
- Efficient MongoDB queries
- Lean option where appropriate
- File streaming for uploads
- Minimal dependencies

## 🤝 Contributing

This is an assignment project, but the architecture supports:
- Easy feature additions
- New country/visa configuration
- Custom evaluation logic
- UI/UX improvements

## 📧 Contact

**Assignment Submission**: atal@opensphere.ai  
**Subject**: Software Engineer Role - Assignment Submission

## 📜 License

This is an assignment project for OpenSphere AI.

---

Built with ❤️ using Node.js, Express, React, MongoDB, and Tailwind CSS
