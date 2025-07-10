const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for flagged packets (in production, use a database)
const flaggedPackets = new Map();

// Simulated ML model training function
function updateMLModel(flagData) {
  console.log('🤖 Updating ML model with new training data:');
  console.log(`   Packet ID: ${flagData.packetId}`);
  console.log(`   Original Prediction: ${flagData.originalPrediction}`);
  console.log(`   User Correction: ${flagData.attackType}`);
  console.log(`   Source IP: ${flagData.sourceIP}`);
  console.log(`   Protocol: ${flagData.protocol}`);
  console.log(`   Port: ${flagData.port}`);
  console.log(`   Timestamp: ${flagData.timestamp}`);
  
  // Simulate reinforcement learning update
  const isCorrection = flagData.originalPrediction !== flagData.attackType;
  if (isCorrection) {
    console.log('   ✅ Model correction detected - adjusting weights');
    console.log(`   📊 Confidence adjustment: ${flagData.confidence ? `${flagData.confidence}%` : 'N/A'}`);
  } else {
    console.log('   ✅ Model confirmation - reinforcing current prediction');
  }
  
  // In a real implementation, this would:
  // 1. Extract features from the packet data
  // 2. Update the neural network weights
  // 3. Retrain specific layers
  // 4. Update the model's confidence scores
  // 5. Save the updated model
  
  console.log('   🔄 Model update complete\n');
}

// API Routes

// Flag a packet for training
app.post('/api/flag-packet', (req, res) => {
  try {
    const flagData = req.body;
    
    // Validate required fields
    const requiredFields = ['packetId', 'attackType', 'timestamp', 'sourceIP', 'destinationIP', 'protocol', 'port'];
    const missingFields = requiredFields.filter(field => !flagData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }
    
    // Store the flagged packet
    flaggedPackets.set(flagData.packetId, {
      ...flagData,
      flaggedAt: new Date().toISOString()
    });
    
    // Update the ML model with the new training data
    updateMLModel(flagData);
    
    res.json({
      success: true,
      message: 'Packet flagged successfully and model updated',
      packetId: flagData.packetId,
      attackType: flagData.attackType
    });
    
  } catch (error) {
    console.error('Error flagging packet:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Update an existing packet flag
app.put('/api/flag-packet/:packetId', (req, res) => {
  try {
    const { packetId } = req.params;
    const flagData = req.body;
    
    // Check if packet exists
    if (!flaggedPackets.has(packetId)) {
      return res.status(404).json({
        error: 'Packet not found',
        packetId
      });
    }
    
    // Get existing flag data
    const existingFlag = flaggedPackets.get(packetId);
    
    // Update the flagged packet
    const updatedFlag = {
      ...existingFlag,
      ...flagData,
      packetId,
      updatedAt: new Date().toISOString()
    };
    
    flaggedPackets.set(packetId, updatedFlag);
    
    // Update the ML model with the corrected data
    updateMLModel(updatedFlag);
    
    res.json({
      success: true,
      message: 'Packet flag updated successfully and model retrained',
      packetId,
      attackType: flagData.attackType,
      previousType: existingFlag.attackType
    });
    
  } catch (error) {
    console.error('Error updating packet flag:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get all flagged packets (for debugging/monitoring)
app.get('/api/flagged-packets', (req, res) => {
  try {
    const packets = Array.from(flaggedPackets.values());
    res.json({
      success: true,
      count: packets.length,
      packets
    });
  } catch (error) {
    console.error('Error retrieving flagged packets:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get model training statistics
app.get('/api/model-stats', (req, res) => {
  try {
    const packets = Array.from(flaggedPackets.values());
    const stats = {
      totalFlags: packets.length,
      corrections: packets.filter(p => p.originalPrediction !== p.attackType).length,
      confirmations: packets.filter(p => p.originalPrediction === p.attackType).length,
      attackTypes: [...new Set(packets.map(p => p.attackType))],
      lastUpdate: packets.length > 0 ? Math.max(...packets.map(p => new Date(p.flaggedAt).getTime())) : null
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error retrieving model stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CyberShield ML Training API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CyberShield ML Training API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Ready to receive training data from flagged packets\n`);
});

module.exports = app;