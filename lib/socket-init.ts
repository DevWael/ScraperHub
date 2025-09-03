const { initializeSocketServer } = require('./socket-server');

// Initialize Socket.IO server when this module is imported
let initialized = false;

async function ensureSocketServer() {
  if (!initialized) {
    try {
      await initializeSocketServer();
      initialized = true;
      // Socket.IO server initialized successfully
    } catch (error) {
      // Failed to initialize Socket.IO server
    }
  }
}

// Auto-initialize when this module is imported
ensureSocketServer();

module.exports = { ensureSocketServer };
