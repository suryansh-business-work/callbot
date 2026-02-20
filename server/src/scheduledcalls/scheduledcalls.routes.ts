import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as ctrl from './scheduledcalls.controllers';

const router = Router();

router.use(authMiddleware);

/** POST /api/scheduled-calls - Create a scheduled call */
router.post('/', ctrl.create);

/** GET /api/scheduled-calls - List scheduled calls */
router.get('/', ctrl.list);

/** GET /api/scheduled-calls/contact/:contactId - Get scheduled calls for a contact */
router.get('/contact/:contactId', ctrl.getByContact);

/** GET /api/scheduled-calls/:id - Get a single scheduled call */
router.get('/:id', ctrl.getById);

/** PUT /api/scheduled-calls/:id - Update a scheduled call */
router.put('/:id', ctrl.update);

/** DELETE /api/scheduled-calls/:id - Delete a scheduled call */
router.delete('/:id', ctrl.remove);

/** POST /api/scheduled-calls/:id/execute - Execute a scheduled call now */
router.post('/:id/execute', ctrl.executeNow);

export default router;
