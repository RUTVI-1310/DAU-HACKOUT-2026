import { Router } from 'express';
import { isGeminiAvailable } from '../services/geminiService.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'GridSense AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    gemini: isGeminiAvailable() ? 'configured' : 'not_configured',
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

export default router;
