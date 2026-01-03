# 🚀 Deployment Guide

This guide will help you deploy the Multi-Country Visa Evaluation Tool to production.

## Prerequisites

- MongoDB Atlas account (or any MongoDB hosting)
- Google Gemini API key (get from https://ai.google.dev/)
- Hosting accounts (see recommendations below)

## Backend Deployment

### Option 1: Railway (Recommended)

1. **Create Railway Account**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   cd backend
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   railway init
   
   # Add environment variables
   railway variables set PORT=4000
   railway variables set MONGODB_URI="your_mongodb_atlas_uri"
   railway variables set GEMINI_API_KEY="your_gemini_key"
   railway variables set GEMINI_MODEL="gemini-1.5-flash"
   railway variables set MAX_SCORE_CAP=85
   
   # Deploy
   railway up
   ```

3. **Get Your Backend URL**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Note this URL for frontend configuration

### Option 2: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create and Deploy**
   ```bash
   cd backend
   heroku create your-visa-eval-api
   
   # Set environment variables
   heroku config:set MONGODB_URI="your_mongodb_atlas_uri"
   heroku config:set GEMINI_API_KEY="your_gemini_key"
   heroku config:set GEMINI_MODEL="gemini-1.5-flash"
   heroku config:set MAX_SCORE_CAP=85
   
   # Deploy
   git push heroku main
   ```

### Option 3: Render

1. Visit https://render.com
2. Create new "Web Service"
3. Connect your GitHub repo
4. Configure:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Add environment variables in Render dashboard

## MongoDB Setup

### MongoDB Atlas (Recommended)

1. **Create Account**
   - Visit https://www.mongodb.com/cloud/atlas
   - Create free tier cluster

2. **Configure Cluster**
   - Create database user with password
   - Whitelist IP: `0.0.0.0/0` (all IPs)
   - Get connection string

3. **Connection String Format**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/visa-eval?retryWrites=true&w=majority
   ```

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel login
   
   # Set environment variable
   vercel env add VITE_API_BASE_URL production
   # Enter your backend URL (e.g., https://your-api.railway.app)
   
   # Deploy
   vercel --prod
   ```

3. **Alternative: GitHub Integration**
   - Visit https://vercel.com
   - Import your GitHub repository
   - Add environment variable: `VITE_API_BASE_URL=https://your-backend-url`
   - Deploy automatically on push

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**
   ```bash
   cd frontend
   netlify login
   netlify init
   
   # Build the app
   npm run build
   
   # Deploy
   netlify deploy --prod
   ```

3. **Set Environment Variables**
   - Go to Netlify dashboard
   - Site settings → Environment variables
   - Add: `VITE_API_BASE_URL=https://your-backend-url`

### Option 3: Cloudflare Pages

1. Visit https://pages.cloudflare.com
2. Connect GitHub repository
3. Configure build:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `frontend`
4. Add environment variable: `VITE_API_BASE_URL`

## Environment Variables Summary

### Backend
```env
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/visa-eval
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
MAX_SCORE_CAP=85
```

### Frontend
```env
VITE_API_BASE_URL=https://your-backend-url.railway.app
```

## Post-Deployment Checklist

- [ ] Backend is accessible at its URL
- [ ] Frontend is accessible and loads
- [ ] MongoDB connection is working
- [ ] File uploads work correctly
- [ ] AI evaluation completes successfully
- [ ] CORS is configured (backend allows frontend domain)
- [ ] Test full evaluation flow:
  1. Select country and visa type
  2. Upload document
  3. Receive evaluation results

## Testing Production

```bash
# Test backend
curl https://your-backend-url.railway.app/health

# Expected response:
# {"ok":true}

# Test API
curl https://your-backend-url.railway.app/api/countries

# Should return list of countries
```

## Monitoring & Maintenance

### Logs
- **Railway**: View logs in Railway dashboard
- **Heroku**: `heroku logs --tail`
- **Render**: View logs in Render dashboard

### Database Monitoring
- MongoDB Atlas dashboard shows:
  - Connection stats
  - Query performance
  - Storage usage

### Gemini API Usage
- Visit https://ai.google.dev/
- Check your API usage and quotas
- Free tier: 15 requests per minute

## Troubleshooting

### CORS Errors
If you see CORS errors in browser console:
```javascript
// backend/src/app.js
app.use(cors({
  origin: ['https://your-frontend-domain.vercel.app'],
  credentials: true
}));
```

### MongoDB Connection Issues
1. Check connection string format
2. Verify IP whitelist in MongoDB Atlas
3. Ensure database user has correct permissions

### File Upload Issues
1. Check file size limits on hosting platform
2. Verify upload directory has write permissions
3. Consider using cloud storage (AWS S3, Cloudflare R2)

### AI Evaluation Timeout
- Increase request timeout in hosting platform settings
- Consider implementing async evaluation with webhooks

## Cost Estimates (Free Tiers)

- **MongoDB Atlas**: Free (512MB storage)
- **Railway**: $5/month credit (sufficient for testing)
- **Vercel**: Free (100GB bandwidth)
- **Gemini API**: Free tier (15 RPM, 1500 RPD)

**Total Estimated Cost**: $0-$5/month for moderate usage

## Support

For issues or questions:
- Check logs first
- Review environment variables
- Test locally to isolate deployment issues
- Contact: atal@opensphere.ai

---

**Happy Deploying! 🎉**
