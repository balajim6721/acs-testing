import Joi from 'joi';

// Token request validation
export const validateTokenRequest = (req, res, next) => {
    const schema = Joi.object({
        displayName: Joi.string().min(1).max(50).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }

    next();
};

// Create room validation
export const validateCreateRoom = (req, res, next) => {
    const schema = Joi.object({
        userId: Joi.string().pattern(/^8:acs:/).required(),
        displayName: Joi.string().min(1).max(50).required(),
        roomName: Joi.string().max(100).optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }

    next();
};

// Join room validation
export const validateJoinRoom = (req, res, next) => {
    const schema = Joi.object({
        userId: Joi.string().pattern(/^8:acs:/).required(),
        displayName: Joi.string().min(1).max(50).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }

    next();
};

// Room ID validation
export const validateRoomId = (req, res, next) => {
    const { roomId } = req.params;

    if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Room ID is required'
        });
    }
    
    const schema = Joi.object({
        roomId: Joi.string().min(1).max(200).required()
            .messages({
                'string.empty': 'Room ID cannot be empty',
                'string.min': 'Room ID must be at least 1 character',
                'string.max': 'Room ID cannot exceed 200 characters',
                'any.required': 'Room ID is required'
            })
    });

    const { error } = schema.validate(req.params);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }

    next();
};