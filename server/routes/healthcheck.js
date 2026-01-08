import { Router } from 'express';

const router = Router();

/**
 * @route   POST /api/auth/token
 * @desc    Generate ACS token for user
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ACS Backend'
    });
});

export default router;