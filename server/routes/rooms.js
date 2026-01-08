import { Router } from 'express';
import {
    createRoom,
    joinRoom,
    getRoomParticipants,
    validateRoom
} from '../services/acs.service.js';
import {
    validateCreateRoom,
    validateJoinRoom,
    validateRoomId
} from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @route   POST /api/rooms/create
 * @desc    Create a new room
 * @access  Public
 */
router.post('/create', validateCreateRoom, async (req, res, next) => {
    try {
        const { userId, displayName, roomName } = req.body;

        logger.info(`Creating room: ${roomName || 'Unnamed Room'}`);
        const room = await createRoom(userId, displayName, roomName);

        res.json({
            success: true,
            data: room
        });
    } catch (error) {
        logger.error('Create room error:', error);
        next(error);
    }
});

/**
 * @route   POST /api/rooms/:roomId/join
 * @desc    Join an existing room
 * @access  Public
 */
router.post('/:roomId/join', validateJoinRoom, async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const { userId, displayName } = req.body;

        logger.info(`User ${displayName} joining room: ${roomId}`);
        const result = await joinRoom(roomId, userId, displayName);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Join room error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/rooms/:roomId/participants
 * @desc    Get room participants
 * @access  Public
 */
router.get('/:roomId/participants', validateRoomId, async (req, res, next) => {
    try {
        const { roomId } = req.params;

        console.log('👥 Getting participants for room:', roomId);
        console.log('   Room ID type:', typeof roomId);
        console.log('   Room ID length:', roomId.length)

        const participants = await getRoomParticipants(roomId);

        console.log(`✅ Found ${participants.count} participants`);

        res.json({
            success: true,
            data: participants
        });
    } catch (error) {
        logger.error('Get participants error:', error);
        console.error('❌ Get participants error:', error);

        // Handle specific Azure errors
        if (error.message.includes('not found') || error.statusCode === 404) {
            return res.status(404).json({
                success: false,
                error: 'Room not found'
            });
        }
        next(error);
    }
});

/**
 * @route   GET /api/rooms/:roomId/validate
 * @desc    Validate if room exists
 * @access  Public
 */
router.get('/:roomId/validate', validateRoomId, async (req, res, next) => {
    try {
        const { roomId } = req.params;

        const isValid = await validateRoom(roomId);

        res.json({
            success: true,
            data: { isValid }
        });
    } catch (error) {
        logger.error('Validate room error:', error);
        next(error);
    }
});

router.get('/debug/all', async (req, res, next) => {
    try {
        console.log('🔍 Listing all rooms...');

        const rooms = [];
        const roomsIterator = roomsClient.listRooms();

        for await (const room of roomsIterator) {
            rooms.push({
                id: room.id,
                validFrom: room.validFrom,
                validUntil: room.validUntil,
                createdAt: room.createdDateTime
            });
        }

        console.log(`✅ Found ${rooms.length} rooms`);

        res.json({
            success: true,
            data: {
                count: rooms.length,
                rooms: rooms
            }
        });
    } catch (error) {
        console.error('❌ List rooms error:', error);
        next(error);
    }
});

export default router;