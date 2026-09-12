import { Router } from 'express';
import {
  createDispatch,
  getLog,
  listLogs,
  updateDispatchStatus,
} from '../services/dispatchStore.js';
import { validateBody, dispatchBodySchema } from '../middleware/validate.js';

const router = Router();

/** GET /api/dispatch – list recent execution logs */
router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json({
    success: true,
    logs: listLogs(limit),
  });
});

/** GET /api/dispatch/:id */
router.get('/:id', (req, res) => {
  const log = getLog(req.params.id);
  if (!log) {
    return res.status(404).json({ success: false, error: 'Dispatch log not found' });
  }
  res.json({ success: true, log });
});

/** POST /api/dispatch – create a new dispatch / execution log */
router.post('/', validateBody(dispatchBodySchema), (req, res) => {
  const log = createDispatch(req.body);
  res.status(201).json({ success: true, log });
});

/** PATCH /api/dispatch/:id – update status */
router.patch('/:id', (req, res) => {
  const { status, notes } = req.body ?? {};
  if (!status || !['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'status must be ACTIVE | COMPLETED | CANCELLED',
    });
  }
  const log = updateDispatchStatus(req.params.id, status, notes);
  if (!log) {
    return res.status(404).json({ success: false, error: 'Dispatch log not found' });
  }
  res.json({ success: true, log });
});

export default router;
