import { Router } from 'express';
import {
  FLEET_PLANTS,
  TOTAL_FLEET_BESS_MW,
  TOTAL_FLEET_BESS_MWH,
  TOTAL_FLEET_CAPACITY_MW,
} from '../data/plants.js';

const router = Router();

/** GET /api/plants – full fleet */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    plants: FLEET_PLANTS,
    totals: {
      capacityMW: TOTAL_FLEET_CAPACITY_MW,
      bessPowerMW: TOTAL_FLEET_BESS_MW,
      bessCapacityMWh: TOTAL_FLEET_BESS_MWH,
    },
  });
});

/** GET /api/plants/:id */
router.get('/:id', (req, res) => {
  const plant = FLEET_PLANTS.find((p) => p.id === req.params.id);
  if (!plant) {
    return res.status(404).json({ success: false, error: 'Plant not found' });
  }
  res.json({ success: true, plant });
});

export default router;
