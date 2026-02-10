# Deployment Guide 🚀

Complete guide to deploy LinkedIn Outreach Pro to production.

## Production Checklist

### 1. Environment Variables

Update `apps/api/.env` for production:

```env
# Google Gemini
GOOGLE_AI_API_KEY=your-production-api-key
GOOGLE_AI_MODEL=gemini-pro

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials.json
GOOGLE_SHEETS_MASTER_SHEET_ID=your-production-sheet-id

# Server
PORT=3001
NODE_ENV=production

# Optional: Telegram Notifications
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### 2. Build for Production

```bash
# Build API
cd apps/api
npm run build

# Build Web
cd ../web
npm run build

# Build Extension
cd ../extension
npm run build
```

### 3. Deployment Options

#### Option A: Single Server (Recommended for MVP)

Deploy both API and Web on one server:

**Using PM2:**

```bash
# Install PM2
npm install -g pm2

# Start API
cd apps/api
pm2 start dist/server.js --name linkedin-api

# Serve Web (using serve)
cd ../web
npm install -g serve
pm2 start "serve -s dist -l 3000" --name linkedin-web

# Save PM2 config
pm2 save
pm2 startup
```

**Using Docker:**

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm install
RUN cd apps/api && npm install
RUN cd apps/web && npm install

# Copy source
COPY . .

# Build
RUN cd apps/api && npm run build
RUN cd apps/web && npm run build

EXPOSE 3000 3001

CMD ["sh", "-c", "cd apps/api && node dist/server.js & cd apps/web && npx serve -s dist -l 3000"]
```

```bash
docker build -t linkedin-outreach-pro .
docker run -d -p 3000:3000 -p 3001:3001 linkedin-outreach-pro
```

#### Option B: Separate Deployments

**API - Railway/Render/Heroku:**

1. Connect GitHub repo
2. Set root directory to `apps/api`
3. Set build command: `npm run build`
4. Set start command: `node dist/server.js`
5. Add environment variables

**Web - Vercel/Netlify:**

1. Connect GitHub repo
2. Set root directory to `apps/web`
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Update API_BASE in code to production API URL

#### Option C: Cloud VPS (DigitalOcean/AWS/GCP)

1. Setup Ubuntu 22.04 server
2. Install Node.js 18+
3. Clone repository
4. Run `./install.sh`
5. Setup nginx reverse proxy
6. Setup SSL with Let's Encrypt
7. Use PM2 to manage processes

### 4. Chrome Extension Distribution

#### Option A: Chrome Web Store (Recommended)

1. Create developer account ($5 one-time fee)
2. Prepare assets:
   - Icon sizes: 16x16, 48x48, 128x128
   - Screenshots: 1280x800 or 640x400
   - Promotional images
3. Zip extension: `cd apps/extension/dist && zip -r extension.zip *`
4. Upload to Chrome Web Store
5. Fill in listing details
6. Submit for review (1-3 days)

#### Option B: Private Distribution

**For Organization:**

1. Package extension as CRX
2. Host on company servers
3. Deploy via Chrome Enterprise policy
4. Users install via internal link

**For Limited Users:**

1. Share `apps/extension/dist` folder
2. Users load as "unpacked extension"
3. Or create self-hosted update server

### 5. Monitoring & Logging

**Add Logging:**

```typescript
// apps/api/src/server.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

**Add Error Tracking:**

```bash
npm install @sentry/node
```

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### 6. Security Considerations

**API Security:**

1. Enable CORS only for production domains
2. Add rate limiting:
   ```bash
   npm install express-rate-limit
   ```
3. Add API key authentication
4. Use HTTPS only
5. Sanitize all inputs

**Extension Security:**

1. Use Content Security Policy
2. Minimize permissions
3. Validate all API responses
4. Don't store sensitive data in localStorage

### 7. Scaling

**Database:**
- Google Sheets works for <10,000 prospects
- For larger: Migrate to PostgreSQL or MongoDB
- Implement caching with Redis

**Queue System:**
- Add Bull or BeeQueue for job processing
- Separate workers for sending requests
- Better failure handling and retries

**Load Balancing:**
- Use nginx or cloud load balancer
- Multiple API instances
- Sticky sessions for extension

### 8. Backup & Recovery

**Automated Backups:**

```bash
# Backup Google Sheets daily
# Script to export sheets to JSON/CSV
# Store in cloud storage (S3, GCS)
```

**Disaster Recovery:**
- Document all setup steps
- Keep credentials in secure vault
- Test restoration process monthly

### 9. Performance Optimization

**API:**
- Enable gzip compression
- Implement caching headers
- Use CDN for static assets
- Optimize database queries

**Web:**
- Code splitting
- Lazy loading routes
- Image optimization
- Bundle analysis

**Extension:**
- Minimize background work
- Use efficient DOM queries
- Batch API calls

### 10. Maintenance

**Regular Tasks:**
- Monitor API logs weekly
- Check error rates
- Review acceptance rates
- Update templates based on performance
- Check LinkedIn for UI changes
- Update extension selectors if needed

**Monthly:**
- Review API costs
- Update dependencies
- Security audit
- Performance review

## Production URLs

After deployment, update these in your code:

**Web App:**
```typescript
// apps/web/vite.config.ts
server: {
  proxy: {
    '/api': 'https://api.yourcompany.com'
  }
}
```

**Extension:**
```typescript
// apps/extension/src/background.ts
const API_BASE = 'https://api.yourcompany.com/api';
```

**Popup:**
```html
<!-- apps/extension/src/popup.html -->
<a href="https://app.yourcompany.com" target="_blank">View All Campaigns →</a>
```

## Support & Monitoring

Set up:
- Health check endpoint monitoring (UptimeRobot, Pingdom)
- Error alerting (Sentry, Rollbar)
- Performance monitoring (New Relic, DataDog)
- User analytics (PostHog, Mixpanel)

---

**Ready for production! 🎉**
