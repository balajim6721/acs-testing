import { CommunicationIdentityClient } from '@azure/communication-identity';
import { RoomsClient } from '@azure/communication-rooms';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Initialize ACS clients
const connectionString = process.env.CONNECTION_STRING;

if (!connectionString) {
    throw new Error('ACS_CONNECTION_STRING is required in environment variables');
}

const identityClient = new CommunicationIdentityClient(connectionString);
const roomsClient = new RoomsClient(connectionString);

// Generate ACS token for user
export const generateToken = async (displayName = 'User') => {
    try {
        console.log('🔑 Generating token for:', displayName);

        // Create ACS user
        const user = await identityClient.createUser();
        console.log('✅ User created:', user);
        console.log('✅ User communicationUserId:', user.communicationUserId);

        // Generate token with VoIP permissions
        const tokenResponse = await identityClient.getToken(user, ["voip"]);
        console.log('✅ Token generated, expires:', tokenResponse.expiresOn);

        const tokenData = {
            userId: user.communicationUserId,
            token: tokenResponse.token,
            expiresOn: tokenResponse.expiresOn,
            displayName
        };

        console.log('📦 Final tokenData:', tokenData);

        logger.info(`Token generated for user: ${user.communicationUserId}`);
        return tokenData;
    } catch (error) {
        logger.error('ACS token generation failed:', error);
        throw new Error(`Failed to generate token: ${error.message}`);
    }
};

// Create a new room
// Create a new room
export const createRoom = async (userId, displayName, roomName = null) => {
    try {
        console.log('🏠 CREATE ROOM DEBUG INFO:');
        console.log('  userId received:', userId);
        console.log('  userId type:', typeof userId);
        console.log('  displayName:', displayName);
        console.log('  roomName:', roomName);

        // Validate userId format
        if (!userId) {
            throw new Error('User ID is required');
        }

        if (typeof userId !== 'string') {
            console.error('❌ userId is not a string:', userId);
            throw new Error(`Invalid user ID type: ${typeof userId}. Expected string.`);
        }

        if (!userId.startsWith('8:acs:')) {
            console.warn('⚠️ userId does not start with 8:acs:', userId);
            // Don't throw, just log - it might still be valid
        }

        const roomTitle = roomName || `${displayName}'s Room`;

        console.log('📝 Creating room with title:', roomTitle);

        // Create room with 24-hour validity
        const room = await roomsClient.createRoom({
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

        console.log('✅ Room created successfully. Room ID:', room.id);

        // Add creator as participant
        console.log('👤 Adding creator as participant...');
        console.log('  Using userId:', userId);

        console.log('✅ Room created via Azure SDK');
        console.log('   Room ID from Azure:', room.id);
        console.log('   Room ID type:', typeof room.id);
        console.log('   Is UUID?', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(room.id));

        const participant = {
            communicationIdentifier: {
                kind: "communicationUser",
                communicationUserId: userId
            },
            role: "Presenter"
        };

        console.log('  Participant object:', JSON.stringify(participant, null, 2));

        try {
            await roomsClient.addOrUpdateParticipants(room.id, [participant]);
            console.log('✅ Creator added to room successfully');
        } catch (addError) {
            console.error('⚠️ Failed to add creator to room:', addError.message);
            console.error('  Error details:', addError);
            // Continue anyway - room is created
        }

        const roomData = {
            roomId: room.id,
            roomTitle,
            createdBy: displayName,
            createdById: userId,
            validFrom: room.validFrom,
            validUntil: room.validUntil,
            participants: [{
                id: userId,
                displayName,
                role: 'Presenter'
            }]
        };

        console.log('📦 Room data to return:', roomData);

        logger.info(`Room created: ${room.id} by ${displayName}`);
        return roomData;
    } catch (error) {
        console.error('❌ Room creation failed:');
        console.error('  Error:', error);
        console.error('  Error message:', error.message);
        console.error('  Error stack:', error.stack);

        logger.error('Room creation failed:', error);
        throw new Error(`Failed to create room: ${error.message}`);
    }
};

// Join an existing room
// Join an existing room
export const joinRoom = async (roomId, userId, displayName) => {
    try {
        console.log('🚪 JOIN ROOM - Starting...');
        console.log('   Room ID:', roomId);
        console.log('   User ID:', userId);
        console.log('   Display Name:', displayName);
        console.log('   User ID type:', typeof userId);

        // Validate inputs
        if (!roomId) {
            throw new Error('Room ID is required');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Check if userId is in correct format
        if (typeof userId !== 'string') {
            console.warn('⚠️ userId is not a string, converting...');
            console.log('   Original userId value:', userId);
            console.log('   Original userId type:', typeof userId);

            // Try to extract string from object
            if (userId && typeof userId === 'object') {
                if (userId.communicationUserId) {
                    userId = userId.communicationUserId;
                    console.log('   Extracted from communicationUserId:', userId);
                } else if (userId.userId) {
                    userId = userId.userId;
                    console.log('   Extracted from userId property:', userId);
                } else if (userId.user && userId.user.communicationUserId) {
                    userId = userId.user.communicationUserId;
                    console.log('   Extracted from user.communicationUserId:', userId);
                } else {
                    console.log('   Full userId object:', JSON.stringify(userId, null, 2));
                    throw new Error('Could not extract user ID from object');
                }
            } else {
                userId = String(userId);
                console.log('   Converted to string:', userId);
            }
        }

        if (!userId.startsWith('8:acs:')) {
            console.warn('⚠️ userId does not start with 8:acs:', userId);
            // Don't throw, just log - it might still be valid
        }

        // Check if room exists
        console.log('🔍 Checking if room exists...');
        try {
            const roomDetails = await roomsClient.getRoom(roomId);
            console.log('✅ Room exists:', roomDetails.id);
            console.log('   Room valid until:', roomDetails.validUntil);
        } catch (roomError) {
            console.error('❌ Room not found or access denied:', roomError.message);
            throw new Error(`Room not found: ${roomId}`);
        }

        // Add participant to room
        console.log('👤 Adding participant to room...');

        // Create participant object with correct structure
        const participantToAdd = {
            communicationIdentifier: {
                kind: "communicationUser",
                communicationUserId: userId
            },
            role: "Attendee"
        };

        console.log('   Participant object:', JSON.stringify(participantToAdd, null, 2));

        try {
            await roomsClient.addOrUpdateParticipants(roomId, [participantToAdd]);
            console.log('✅ User successfully added to room');
        } catch (addError) {
            console.error('❌ Failed to add participant:');
            console.error('   Error name:', addError.name);
            console.error('   Error message:', addError.message);
            console.error('   Error code:', addError.code);
            console.error('   Error statusCode:', addError.statusCode);

            // Handle specific errors
            if (addError.message && addError.message.includes('already exists')) {
                console.log('ℹ️ User already in room - this is OK for join flow');
            } else {
                throw addError;
            }
        }

        // Get updated participant list to verify
        console.log('📋 Verifying participant was added...');
        try {
            const participants = [];
            const participantsIterator = roomsClient.listParticipants(roomId);

            for await (const participant of participantsIterator) {
                console.log('   Found participant:', participant);

                // Debug participant structure
                console.log('   Participant identifier:', participant.identifier);
                console.log('   Participant identifier type:', typeof participant.identifier);

                if (participant.identifier && typeof participant.identifier === 'object') {
                    console.log('   Identifier keys:', Object.keys(participant.identifier));
                    console.log('   Has communicationUserId?', 'communicationUserId' in participant.identifier);
                }

                participants.push(participant);
            }

            console.log(`✅ Total participants in room: ${participants.length}`);
        } catch (listError) {
            console.warn('⚠️ Could not list participants:', listError.message);
            // Don't fail join if listing fails
        }

        const result = {
            roomId,
            userId,
            displayName,
            joinedAt: new Date().toISOString(),
            success: true
        };

        console.log('🎉 Join room successful:', result);

        return result;
    } catch (error) {
        console.error('❌ Join room failed:');
        console.error('   Error:', error);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);

        // Re-throw with user-friendly message
        if (error.message.includes('not found')) {
            throw new Error(`Room ${roomId} not found. Please check the Room ID.`);
        } else if (error.message.includes('already exists')) {
            throw new Error('You are already in this room.');
        } else if (error.message.includes('expired')) {
            throw new Error('This room has expired.');
        } else {
            throw new Error(`Failed to join room: ${error.message}`);
        }
    }
};

// Get room participants
export const getRoomParticipants = async (roomId) => {
    try {
        console.log('🔍 Getting participants for room:', roomId);

        // Validate room exists first
        try {
            const room = await roomsClient.getRoom(roomId);
            console.log('✅ Room exists:', room.id);
        } catch (roomError) {
            console.error('❌ Room not found or access denied:', roomError.message);
            throw new Error(`Room not found: ${roomId}`);
        }

        const participants = [];
        const participantsIterator = roomsClient.listParticipants(roomId);

        console.log('📋 Listing participants...');
        let count = 0;

        for await (const participant of participantsIterator) {
            count++;
            console.log(`\n👤 Participant ${count}:`);
            console.log('   Raw participant:', JSON.stringify(participant, null, 2));

            // Extract user ID safely - handle different Azure SDK versions
            let userId = 'Unknown';
            let role = 'Attendee';

            // Debug the structure
            console.log('   Participant identifier:', participant.identifier);
            console.log('   Identifier type:', typeof participant.identifier);

            if (participant.identifier) {
                if (typeof participant.identifier === 'string') {
                    // Some versions return string directly
                    userId = participant.identifier;
                    console.log('   Identifier is string:', userId);
                } else if (typeof participant.identifier === 'object') {
                    console.log('   Identifier keys:', Object.keys(participant.identifier));

                    // Try different possible property names
                    if (participant.identifier.communicationUserId) {
                        userId = participant.identifier.communicationUserId;
                        console.log('   Found communicationUserId:', userId);
                    } else if (participant.identifier.id) {
                        userId = participant.identifier.id;
                        console.log('   Found id:', userId);
                    } else if (participant.identifier.kind === 'communicationUser' &&
                        participant.identifier.communicationUserId) {
                        userId = participant.identifier.communicationUserId;
                        console.log('   Found in kind structure:', userId);
                    }
                }
            }

            if (participant.role) {
                role = participant.role;
            }

            console.log(`   Extracted - User ID: ${userId}, Role: ${role}`);

            participants.push({
                id: userId,
                role: role,
                displayName: `User ${count}`, // Azure doesn't store display names
                raw: participant // Include raw data for debugging
            });
        }

        console.log(`✅ Total participants: ${participants.length}`);

        return {
            roomId,
            count: participants.length,
            participants
        };
    } catch (error) {
        console.error('❌ Get participants failed:');
        console.error('   Error message:', error.message);
        console.error('   Error code:', error.code);
        console.error('   Error statusCode:', error.statusCode);

        if (error.statusCode === 404) {
            throw new Error(`Room ${roomId} not found`);
        }

        throw new Error(`Failed to get participants: ${error.message}`);
    }
};

// Validate room exists
export const validateRoom = async (roomId) => {
    try {
        await roomsClient.getRoom(roomId);
        return true;
    } catch (error) {
        return false;
    }
};