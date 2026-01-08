import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add interceptors for debugging
api.interceptors.request.use(
    config => {
        console.log('API Request:', {
            url: config.url,
            method: config.method,
            data: config.data
        });
        return config;
    },
    error => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    response => {
        console.log('API Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data
        });
        return response;
    },
    error => {
        console.error('API Response Error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
            response: error.response?.data
        });
        return Promise.reject(error);
    }
);

export const healthCheck = async () => {
    try {
        const response = await axios.get('http://localhost:4000/health');
        return response.data;
    } catch (error) {
        console.error('Health check failed:', error);
        throw error;
    }
};

// Generate ACS token
export const generateToken = async (displayName) => {
    try {
        console.log('🔑 Generating token for:', displayName);

        const response = await api.post('/auth/token', { displayName });
        console.log('✅ Token response:', response.data);

        const responseData = response.data;

        // Handle different response structures
        let userId, token, displayNameFromResponse;

        // Structure 1: { success: true, data: { user: { communicationUserId: ... }, token: ... } }
        if (responseData.data) {
            const data = responseData.data;

            if (data.user && data.user.communicationUserId) {
                userId = data.user.communicationUserId;
                token = data.token;
                displayNameFromResponse = data.displayName;
            }
            // Structure 2: { success: true, data: { userId: ..., token: ... } }
            else if (data.userId) {
                userId = data.userId;
                token = data.token;
                displayNameFromResponse = data.displayName;
            }
            // Structure 3: { success: true, data: { communicationUserId: ..., token: ... } }
            else if (data.communicationUserId) {
                userId = data.communicationUserId;
                token = data.token;
                displayNameFromResponse = data.displayName;
            }
        }
        // Structure 4: Direct { userId: ..., token: ... }
        else if (responseData.userId) {
            userId = responseData.userId;
            token = responseData.token;
            displayNameFromResponse = responseData.displayName;
        }
        // Structure 5: { user: { communicationUserId: ... }, token: ... }
        else if (responseData.user && responseData.user.communicationUserId) {
            userId = responseData.user.communicationUserId;
            token = responseData.token;
            displayNameFromResponse = responseData.displayName;
        }

        if (!userId || !token) {
            console.error('❌ Could not extract userId or token from response:');
            console.error('   Full response:', responseData);
            throw new Error('Invalid token response structure');
        }

        console.log('✅ Extracted - userId:', userId, 'token present:', !!token);

        return {
            userId,
            token,
            displayName: displayNameFromResponse || displayName
        };
    } catch (error) {
        console.error('Token generation failed:', error);
        throw error;
    }
};

// Create a new room
export const createRoom = async (userId, displayName, roomName = null) => {
    try {
        console.log('📤 Sending create room request:');
        console.log('  userId:', userId);
        console.log('  displayName:', displayName);
        console.log('  roomName:', roomName);
        console.log('  userId type:', typeof userId);

        // Validate userId
        if (!userId) {
            throw new Error('User ID is required');
        }

        if (typeof userId !== 'string') {
            console.error('❌ userId is not a string in frontend:', userId);
            throw new Error('Invalid user ID format');
        }

        if (!userId.startsWith('8:acs:')) {
            console.warn('⚠️ userId in frontend does not start with 8:acs:', userId);
        }

        const response = await api.post('/rooms/create', {
            userId,
            displayName,
            roomName
        });

        console.log('✅ Create room response:', response.data);
        return response.data.data;
    } catch (error) {
        console.error('❌ Create room failed:');
        console.error('  Error:', error);
        console.error('  Response:', error.response?.data);
        throw error;
    }
};

// Join existing room
export const joinRoom = async (roomId, userId, displayName) => {
    try {
        const response = await api.post(`/rooms/${roomId}/join`, {
            userId,
            displayName
        });
        return response.data.data;
    } catch (error) {
        console.error('Join room failed:', error);
        throw error;
    }
};

// Validate room exists
export const validateRoom = async (roomId) => {
    try {
        const response = await api.get(`/rooms/${roomId}/validate`);
        return response.data.data.isValid;
    } catch (error) {
        console.error('Validate room failed:', error);
        return false;
    }
};

// Get room participants
export const getRoomParticipants = async (roomId) => {
    try {
        const response = await api.get(`/rooms/${roomId}/participants`);
        return response.data.data;
    } catch (error) {
        console.error('Get participants failed:', error);
        throw error;
    }
};

// Debug function to test room ID
export const testRoomId = async (roomId) => {
    try {
        console.log('🧪 Testing room ID:', roomId);

        // Test 1: Validate endpoint
        console.log('1. Testing validate endpoint...');
        const isValid = await validateRoom(roomId);
        console.log('   Validate result:', isValid);

        // Test 2: Participants endpoint
        console.log('2. Testing participants endpoint...');
        try {
            const participants = await getRoomParticipants(roomId);
            console.log('   Participants result:', participants.count, 'participants');
        } catch (error) {
            console.log('   Participants error:', error.message);
        }

        // Test 3: Direct API call
        console.log('3. Testing direct API call...');
        try {
            const response = await api.get(`/rooms/${roomId}`);
            console.log('   Direct API result:', response.data);
        } catch (error) {
            console.log('   Direct API error:', error.response?.data || error.message);
        }

        return { roomId, isValid };
    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    }
};

// List all rooms (debug)
export const listAllRooms = async () => {
    try {
        const response = await api.get('/rooms/debug/all');
        return response.data.data;
    } catch (error) {
        console.error('List rooms failed:', error);
        throw error;
    }
};

export default api;