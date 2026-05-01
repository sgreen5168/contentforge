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

// ── CORS — allow ALL origins ──────────────────────────────────────────────────
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Extra headers for all responses
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve generated videos
app.use('/output', express.static(OUTPUT_DIR));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({
  status: 'ContentForge Video Engine v1.0 running',
  endpoints: ['/api/video', '/api/persona', '/api/vsl', '/api/upload', '/api/affiliate']
}));
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/video',     videoRoutes);
app.use('/api/persona',   personaRoutes);
app.use('/api/vsl',       vslRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/affiliate', affiliateRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const server = createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ ContentForge Video Engine running on port ${PORT}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
});
