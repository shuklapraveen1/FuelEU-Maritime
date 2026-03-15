/**
 * ComplianceController — Inbound HTTP Adapter
 *
 * Exposes compliance balance, banking, and pooling endpoints.
 */

import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { ComplianceUseCases } from '../../../core/application/ComplianceUseCases';

const ShipYearSchema = z.object({
  shipId: z.string().min(1, 'shipId is required'),
  year: z.number().int().min(2020).max(2100),
});

const CreatePoolSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  shipIds: z.array(z.string().min(1)).min(2, 'Pool requires at least 2 ships'),
});

export function createComplianceRouter(
  complianceUseCases: ComplianceUseCases
): Router {
  const router = Router();

  /**
   * @openapi
   * /compliance/cb:
   *   get:
   *     summary: Get compliance balance summaries for all ships
   *     tags: [Compliance]
   *     responses:
   *       200:
   *         description: Array of compliance balance summaries (cbBefore, banked, cbAfter)
   */
  router.get('/cb', async (_req: Request, res: Response) => {
    const balances = await complianceUseCases.getComplianceBalances();
    return res.json({ data: balances });
  });

  /**
   * @openapi
   * /compliance/adjusted-cb:
   *   get:
   *     summary: Get adjusted compliance balances (CB minus banked)
   *     tags: [Compliance]
   *     responses:
   *       200:
   *         description: Adjusted CB per ship, used for pooling eligibility
   */
  router.get('/adjusted-cb', async (_req: Request, res: Response) => {
    const adjustedCbs = await complianceUseCases.getAdjustedComplianceBalances();
    return res.json({ data: adjustedCbs });
  });

  return router;
}

export function createBankingRouter(
  complianceUseCases: ComplianceUseCases
): Router {
  const router = Router();

  /**
   * @openapi
   * /banking/records:
   *   get:
   *     summary: Get all banking records
   *     tags: [Banking]
   */
  router.get('/records', async (_req: Request, res: Response) => {
    const records = await complianceUseCases.getBankingRecords();
    return res.json({ data: records });
  });

  /**
   * @openapi
   * /banking/bank:
   *   post:
   *     summary: Bank surplus compliance balance (Article 20)
   *     tags: [Banking]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               shipId:
   *                 type: string
   *               year:
   *                 type: integer
   */
  router.post('/bank', async (req: Request, res: Response) => {
    const parsed = ShipYearSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten(),
      });
    }
    const result = await complianceUseCases.bankSurplus(parsed.data);
    return res.json({ data: result });
  });

  /**
   * @openapi
   * /banking/apply:
   *   post:
   *     summary: Apply banked surplus to current compliance balance (Article 20)
   *     tags: [Banking]
   */
  router.post('/apply', async (req: Request, res: Response) => {
    const parsed = ShipYearSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten(),
      });
    }
    const result = await complianceUseCases.applyBanked(parsed.data);
    return res.json({ data: result });
  });

  return router;
}

export function createPoolingRouter(
  complianceUseCases: ComplianceUseCases
): Router {
  const router = Router();

  /**
   * @openapi
   * /pools:
   *   post:
   *     summary: Create a compliance pool (Article 21)
   *     tags: [Pooling]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               year:
   *                 type: integer
   *               shipIds:
   *                 type: array
   *                 items:
   *                   type: string
   */
  router.post('/', async (req: Request, res: Response) => {
    const parsed = CreatePoolSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten(),
      });
    }
    const pool = await complianceUseCases.createPool(parsed.data);
    return res.status(201).json({ data: pool });
  });

  return router;
}
