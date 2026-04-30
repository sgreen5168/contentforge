import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { existsSync, mkdirSync } from 'fs';
import videoRoutes from './routes/video.js';
import personaRoutes from './routes/persona.js';
import vslRoutes from './routes/vsl.js';
import uploadRoutes from './routes/upload.js';
import affiliateRoutes from './routes/affiliate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Ensure output directory exists
const OUTPUT_DIR = process.env.OUTPUT_DIR || './output';
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// Middleware
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve generated videos
app.use('/output', express.static(OUTPUT_DIR));

// Routes
app.use('/api/video', videoRoutes);
app.use('/api/persona', personaRoutes);
app.use('/api/vsl', vslRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/affiliate', affiliateRoutes);

// Health check
app.get('/', (_req, res) => res.json({
  status: 'ContentForge Video Engine v1.0 running',
  endpoints: ['/api/video', '/api/persona', '/api/vsl', '/api/upload', '/api/affiliate']
}));
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0' }));

const server = createServer(app);
server.listen(PORT, () => {
  console.log(`✅ ContentForge Video Engine running on http://localhost:${PORT}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
});
