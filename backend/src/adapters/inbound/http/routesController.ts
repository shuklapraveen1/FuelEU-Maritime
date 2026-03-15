/**
 * RoutesController — Inbound HTTP Adapter
 *
 * Maps HTTP requests to RouteUseCases application methods.
 * Handles request validation, error mapping, and response shaping.
 */

import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { RouteUseCases } from '../../../core/application/RouteUseCases';

const RouteFiltersSchema = z.object({
  vesselType: z.string().optional(),
  fuelType: z.string().optional(),
  year: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(2020).max(2100))
    .optional(),
});

export function createRoutesRouter(routeUseCases: RouteUseCases): Router {
  const router = Router();

  /**
   * @openapi
   * /routes:
   *   get:
   *     summary: List all maritime routes
   *     tags: [Routes]
   *     parameters:
   *       - in: query
   *         name: vesselType
   *         schema:
   *           type: string
   *       - in: query
   *         name: fuelType
   *         schema:
   *           type: string
   *       - in: query
   *         name: year
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Array of route objects
   */
  router.get('/', async (req: Request, res: Response) => {
    const parsed = RouteFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: parsed.error.flatten(),
      });
    }

    const routes = await routeUseCases.listRoutes(parsed.data);
    return res.json({ data: routes.map((r) => r.toProps()) });
  });

  /**
   * @openapi
   * /routes/comparison:
   *   get:
   *     summary: Compare all routes against the current baseline
   *     tags: [Routes]
   *     responses:
   *       200:
   *         description: Comparison results
   *       404:
   *         description: No baseline set
   */
  router.get('/comparison', async (_req: Request, res: Response) => {
    const comparisons = await routeUseCases.compareRoutes();
    return res.json({ data: comparisons });
  });

  /**
   * @openapi
   * /routes/{routeId}/baseline:
   *   post:
   *     summary: Set a route as the compliance baseline
   *     tags: [Routes]
   *     parameters:
   *       - in: path
   *         name: routeId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Updated route with isBaseline=true
   *       404:
   *         description: Route not found
   */
  router.post('/:routeId/baseline', async (req: Request, res: Response) => {
    const { routeId } = req.params;
    const route = await routeUseCases.setBaseline(routeId);
    return res.json({ data: route.toProps() });
  });

  return router;
}
