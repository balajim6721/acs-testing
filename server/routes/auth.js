import { Router } from 'express';
import { generateToken } from '../services/acs.service.js';
import { validateTokenRequest } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @route   POST /api/auth/token
 * @desc    Generate ACS token for user
 * @access  Public
 */
router.post('/token', validateTokenRequest, async (req, res, next) => {
    try {
        const { displayName } = req.body;

        logger.info('Generating token for user:', displayName);
        const tokenData = await generateToken(displayName);

        res.json({
            success: true,
            data: tokenData
        });
    } catch (error) {
        logger.error('Token generation error:', error);
        next(error);
    }
});

/**
 * @route   POST /api/auth/debug-user
 * @desc    Debug endpoint to see user structure
 * @access  Public
 */
router.post('/debug-user', async (req, res, next) => {
    try {
        const { displayName } = req.body;

        console.log('🔍 Debug user creation for:', displayName);

        // Create ACS user
        const user = await identityClient.createUser();
        console.log('✅ Raw user object from Azure:');
        console.log('   Type:', typeof user);
        console.log('   Keys:', Object.keys(user));
        console.log('   communicationUserId:', user.communicationUserId);
        console.log('   Full object:', JSON.stringify(user, null, 2));

        // Generate token
        const tokenResponse = await identityClient.getToken(user, ["voip"]);

        res.json({
            success: true,
            debug: {
                rawUser: user,
                communicationUserId: user.communicationUserId,
                token: tokenResponse.token,
                tokenExpires: tokenResponse.expiresOn,
                userStructure: {
                    type: typeof user,
                    keys: Object.keys(user),
                    isString: typeof user.communicationUserId === 'string',
                    value: user.communicationUserId
                }
            }
        });
    } catch (error) {
        console.error('Debug user error:', error);
        next(error);
    }
});

export default router;