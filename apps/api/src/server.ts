import dotenv from 'dotenv';
dotenv.config(); // Must be first!

import express from 'express';
import cors from 'cors';
import campaignRoutes from './routes/campaigns';
import templateRoutes from './routes/templates';
import prospectRoutes from './routes/prospects';
import extensionRoutes from './routes/extension';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/campaigns', campaignRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/prospects', prospectRoutes);
app.use('/api/extension', extensionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

export default app;
