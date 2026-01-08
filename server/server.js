import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { CommunicationIdentityClient } from "@azure/communication-identity";
import { RoomsClient } from "@azure/communication-rooms";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;
const connectionString = process.env.CONNECTION_STRING;

if (!connectionString) {
  throw new Error("❌ CONNECTION_STRING missing in .env");
}

// ===============================
// Azure ACS Clients
// ===============================
const identityClient = new CommunicationIdentityClient(connectionString);
const roomsClient = new RoomsClient(connectionString);

// ===============================
// 1️⃣ Create ACS User + Token
// POST /api/token
// ===============================
app.post("/api/token", async (req, res) => {
  try {
    const scopes = ["voip", "chat"];

    const user = await identityClient.createUser();
    const tokenResponse = await identityClient.getToken(user, scopes);

    console.log("✅ Token created for user:", user.communicationUserId);

    res.json({
      user: {
        communicationUserId: user.communicationUserId
      },
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn
    });
  } catch (error) {
    console.error("❌ Token error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// ===============================
// 2️⃣ Create Room
// POST /api/rooms/create
// ===============================
app.post("/api/rooms/create", async (req, res) => {
  try {
    const { roomName, createdBy, userId } = req.body;

    console.log("🏠 CREATE ROOM REQUEST");
    console.log("   Room Name:", roomName);
    console.log("   Created By:", createdBy);
    console.log("   User ID:", userId);

    // Create the room
    const room = await roomsClient.createRoom({
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    console.log("✅ Room created:", room.id);

    // ✅ Automatically add the creator as a participant
    if (userId) {
      // Validate userId format
      if (typeof userId !== 'string' || !userId.startsWith('8:acs:')) {
        console.error("⚠️ Invalid userId format:", userId);
        return res.status(400).json({ 
          error: "Invalid userId format",
          received: userId
        });
      }

      try {
        console.log("➕ Adding creator to room with userId:", userId);
        
        // Try the correct format for Azure SDK
        const participantToAdd = {
          communicationIdentifier: { 
            kind: "communicationUser",
            communicationUserId: userId 
          },
          role: "Presenter"
        };
        
        console.log("   Participant object:", JSON.stringify(participantToAdd, null, 2));
        
        await roomsClient.addOrUpdateParticipants(room.id, [participantToAdd]);
        
        console.log("✅ Creator added to room successfully");
      } catch (addError) {
        console.error("⚠️ Failed to add creator to room:", addError.message);
        console.error("   Error details:", addError);
        // Continue anyway - room is created, user can join manually
      }
    } else {
      console.log("⚠️ No userId provided, skipping auto-add");
    }

    res.json({
      roomId: room.id,
      roomName,
      createdBy,
      validFrom: room.validFrom,
      validUntil: room.validUntil
    });
  } catch (error) {
    console.error("❌ Create room error:", error);
    console.error("   Error message:", error.message);
    res.status(500).json({ 
      error: "Failed to create room",
      details: error.message
    });
  }
});

// ===============================
// 3️⃣ Join Room (Add Participant)
// POST /api/rooms/:roomId/join
// ===============================
app.post("/api/rooms/:roomId/join", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, displayName } = req.body;

    console.log("📞 JOIN ROOM REQUEST");
    console.log("   Room ID:", roomId);
    console.log("   User ID:", userId);
    console.log("   User ID type:", typeof userId);
    console.log("   Display Name:", displayName);

    // Validate userId format
    if (!userId) {
      console.error("❌ userId is missing");
      return res.status(400).json({ 
        error: "userId is required",
        received: userId
      });
    }

    // Check if userId is in correct format (should start with "8:acs:")
    if (typeof userId !== 'string') {
      console.error("❌ userId is not a string:", userId);
      return res.status(400).json({ 
        error: "userId must be a string",
        received: typeof userId
      });
    }

    if (!userId.startsWith("8:acs:")) {
      console.error("❌ Invalid userId format. Expected format: 8:acs:...");
      console.error("   Received:", userId);
      return res.status(400).json({ 
        error: "Invalid ACS userId format. Must start with '8:acs:'",
        received: userId,
        hint: "Make sure you're using the communicationUserId from the token response"
      });
    }

    // Check if room exists
    let roomDetails;
    try {
      roomDetails = await roomsClient.getRoom(roomId);
      console.log("✅ Room found:", roomDetails.id);
    } catch (error) {
      console.error("❌ Room not found:", roomId);
      console.error("   Error:", error.message);
      return res.status(404).json({ 
        error: "Room not found",
        roomId: roomId,
        hint: "Please check the room ID is correct"
      });
    }

    // Add participant to room with correct syntax
    console.log("➕ Adding participant to room...");
    try {
      const participantToAdd = {
        communicationIdentifier: { 
          kind: "communicationUser",
          communicationUserId: userId 
        },
        role: "Attendee"
      };
      
      console.log("   Participant object:", JSON.stringify(participantToAdd, null, 2));
      
      await roomsClient.addOrUpdateParticipants(roomId, [participantToAdd]);
      
      console.log("✅ User successfully added to room");
    } catch (addError) {
      console.error("❌ Failed to add participant:", addError.message);
      console.error("   Full error:", addError);
      throw addError;
    }

    res.json({ 
      success: true, 
      message: "Successfully joined room",
      roomId: roomId,
      userId: userId
    });
  } catch (error) {
    console.error("❌ Join room error:", error);
    console.error("   Error name:", error.name);
    console.error("   Error message:", error.message);
    console.error("   Error stack:", error.stack);

    res.status(500).json({
      error: "Failed to join room",
      details: error.message,
      errorType: error.name
    });
  }
});

// ===============================
// 4️⃣ Get Room Details
// GET /api/rooms/:roomId
// ===============================
app.get("/api/rooms/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await roomsClient.getRoom(roomId);

    res.json({
      roomId: room.id,
      validFrom: room.validFrom,
      validUntil: room.validUntil,
      createdAt: room.createdDateTime
    });
  } catch (error) {
    console.error("❌ Get room error:", error);
    res.status(404).json({ error: "Room not found" });
  }
});

// ===============================
// 5️⃣ Get Room Participants
// GET /api/rooms/:roomId/participants
// ===============================
app.get("/api/rooms/:roomId/participants", async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const participants = await roomsClient.listParticipants(roomId);
    const participantList = [];
    
    for await (const participant of participants) {
      participantList.push(participant);
    }

    res.json({
      roomId: roomId,
      participants: participantList,
      count: participantList.length
    });
  } catch (error) {
    console.error("❌ Get participants error:", error);
    res.status(500).json({ error: "Failed to get participants" });
  }
});

// ===============================
// 6️⃣ Health Check
// GET /api/health
// ===============================
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "Azure Communication Services Backend"
  });
});

// ===============================
// Server Start
// ===============================
app.listen(PORT, () => {
  console.log(`✅ ACS server running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});