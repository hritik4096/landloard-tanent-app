// WebSocket Service Implementation
class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageListeners = [];
    this.statusListeners = [];
    this.typingListeners = [];
  }

  // Connect to the WebSocket server
  connect(url, token) {
    return new Promise((resolve, reject) => {
      try {
        // For development, we'll just simulate WebSocket connection
        console.log('Simulating WebSocket connection to', url);
        this.isConnected = true;
        
        // Simulate successful connection
        setTimeout(() => {
          this.notifyStatusListeners('connected');
          resolve();
        }, 500);
        
        return true;
      } catch (error) {
        console.error('WebSocket connection error:', error);
        reject(error);
        return false;
      }
    });
  }

  // Disconnect from the WebSocket server
  disconnect() {
    console.log('Disconnecting WebSocket');
    this.isConnected = false;
    this.notifyStatusListeners('disconnected');
    return true;
  }

  // Send a message
  sendMessage(message) {
    if (!this.isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }
    
    console.log('Sending message via WebSocket:', message);
    return true;
  }

  // Send typing status
  sendTyping(data) {
    if (!this.isConnected) {
      return false;
    }
    
    console.log('Sending typing indicator:', data);
    return true;
  }

  // Add a message listener
  addMessageListener(callback) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    };
  }

  // Add a status listener
  addStatusListener(callback) {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  // Add a typing listener
  addTypingListener(callback) {
    this.typingListeners.push(callback);
    return () => {
      this.typingListeners = this.typingListeners.filter(cb => cb !== callback);
    };
  }

  // Notify message listeners
  notifyMessageListeners(message) {
    this.messageListeners.forEach(callback => callback(message));
  }

  // Notify status listeners
  notifyStatusListeners(status) {
    this.statusListeners.forEach(callback => callback(status));
  }

  // Notify typing listeners
  notifyTypingListeners(data) {
    this.typingListeners.forEach(callback => callback(data));
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

// Mock WebSocket service for chat functionality
export const connectWebSocket = ({ onMessage, onOpen, onClose, onError }) => {
  console.log('Setting up WebSocket mock connection');
  
  // Simulate successful connection
  setTimeout(() => {
    console.log('WebSocket connected');
    if (onOpen) onOpen();
    
    // Start sending mock events occasionally
    startMockEventsSending(onMessage);
  }, 1000);
  
  // Return a mock socket with close method
  return {
    close: () => {
      console.log('WebSocket disconnected');
      if (onClose) onClose();
    }
  };
};

// Send mock messages occasionally
let eventInterval = null;

function startMockEventsSending(callback) {
  if (!callback) return;
  
  // Clear any existing interval
  if (eventInterval) {
    clearInterval(eventInterval);
  }
  
  // Set up new interval to send random events
  eventInterval = setInterval(() => {
    // Only send an event 20% of the time
    if (Math.random() > 0.2) return;
    
    const events = [
      {
        type: 'typing_status',
        payload: {
          contactId: 'contact1',
          isTyping: true
        }
      },
      {
        type: 'user_status',
        payload: {
          contactId: 'contact2',
          isOnline: Math.random() > 0.5
        }
      }
    ];
    
    // Get random event
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    // If it's a typing event, automatically stop typing after a few seconds
    if (randomEvent.type === 'typing_status' && randomEvent.payload.isTyping) {
      callback(randomEvent);
      
      setTimeout(() => {
        callback({
          type: 'typing_status',
          payload: {
            contactId: randomEvent.payload.contactId,
            isTyping: false
          }
        });
      }, 3000 + Math.random() * 5000);
    } else {
      callback(randomEvent);
    }
    
  }, 10000); // Every 10 seconds
  
  return () => {
    if (eventInterval) {
      clearInterval(eventInterval);
      eventInterval = null;
    }
  };
}

export default {
  connectWebSocket
};
