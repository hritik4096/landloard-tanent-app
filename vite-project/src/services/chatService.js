// Basic Chat Service Implementation
class ChatService {
  constructor() {
    this.baseUrl = "http://localhost:5000/api";
  }

  // Mock data for contacts and messages
  async getContacts() {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock contacts
    return [];
  }

  async getMessages(contactId) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Return mock messages based on contact ID
    const mockMessages = {
      "contact-1": [
        {
          id: "msg-1-1",
          contactId: "contact-1",
          senderId: "contact-1",
          text: "Hello, I have a question about my apartment",
          timestamp: Date.now() - 3600000,
          status: "read",
        },
        {
          id: "msg-1-2",
          contactId: "contact-1",
          senderId: "currentUser",
          text: "Of course, how can I help you?",
          timestamp: Date.now() - 3000000,
          status: "delivered",
        },
      ],
      "contact-2": [
        {
          id: "msg-2-1",
          contactId: "contact-2",
          senderId: "currentUser",
          text: "Hi Sarah, I've prepared the monthly reports",
          timestamp: Date.now() - 86400000,
          status: "read",
        },
      ],
      "ai-assistant": [
        {
          id: "msg-3-1",
          contactId: "ai-assistant",
          senderId: "ai-assistant",
          text: "Hello! I'm your property management assistant. How can I help you today?",
          timestamp: Date.now() - 7200000,
          status: "read",
          isAI: true,
        },
      ],
    };

    return mockMessages[contactId] || [];
  }

  async sendMessage(contactId, text, attachment = null) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Create a new message object
    const newMessage = {
      id: `msg-${Date.now()}`,
      contactId,
      senderId: "currentUser",
      text,
      timestamp: new Date().toISOString(),
      status: "delivered",
    };

    return newMessage;
  }

  async markMessagesAsRead(contactId) {
    // Simulate marking messages as read
    console.log("Marking messages as read for contact", contactId);
    return { success: true };
  }

  async createAIAssistant(name, specialty) {
    // Simulate creating an AI assistant
    console.log("Creating AI assistant:", name, specialty);
    return {
      id: `ai-${Date.now()}`,
      name,
      specialty,
      isAI: true,
    };
  }

  // Generate random timestamps within the last 7 days
  randomTimestamp() {
    const randomTime =
      Date.now() - Math.floor(Math.random() * 7 * 24 * 3600000);
    return new Date(randomTime).toISOString();
  }

  // Create mock messages for each contact
  generateMockMessages(contactId) {
    const messages = [];
    const isAI = contactId.startsWith("ai-");

    // Create different conversation flows based on contact
    if (contactId === "contact1") {
      messages.push(
        {
          id: "msg1-1",
          contactId,
          senderId: contactId,
          text: "Hi there! Do you have time for a quick call today?",
          timestamp: this.randomTimestamp(),
          status: "read",
        },
        {
          id: "msg1-2",
          contactId,
          senderId: "currentUser",
          text: "Sure, I'm free after 3pm. Does that work for you?",
          timestamp: this.randomTimestamp(),
          status: "delivered",
        },
        {
          id: "msg1-3",
          contactId,
          senderId: contactId,
          text: "Perfect! Let's do 3:30pm then.",
          timestamp: this.randomTimestamp(),
          status: "read",
        },
        {
          id: "msg1-4",
          contactId,
          senderId: "currentUser",
          text: "Great, I'll send a calendar invite.",
          timestamp: this.randomTimestamp(),
          status: "delivered",
        },
        {
          id: "msg1-5",
          contactId,
          senderId: contactId,
          text: "Looking forward to our meeting tomorrow!",
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          status: "unread",
        }
      );
    } else if (contactId === "contact2") {
      messages.push(
        {
          id: "msg2-1",
          contactId,
          senderId: "currentUser",
          text: "Hi John, I've sent you the project update.",
          timestamp: this.randomTimestamp(),
          status: "delivered",
        },
        {
          id: "msg2-2",
          contactId,
          senderId: contactId,
          text: "Got it, I'll review it shortly.",
          timestamp: this.randomTimestamp(),
          status: "read",
        },
        {
          id: "msg2-3",
          contactId,
          senderId: "currentUser",
          text: "Let me know if you have any questions!",
          timestamp: this.randomTimestamp(),
          status: "delivered",
        },
        {
          id: "msg2-4",
          contactId,
          senderId: contactId,
          text: "Thanks for the update.",
          timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
          status: "read",
        }
      );
    } else if (isAI) {
      // Find assistant in contacts
      const contacts = [
        {
          id: "contact1",
          name: "Jane Smith",
          isOnline: true,
          lastMessage: "Looking forward to our meeting tomorrow!",
          lastMessageTime: new Date(Date.now() - 15 * 60000).toISOString(),
          unread: 2,
        },
        {
          id: "contact2",
          name: "John Davis",
          isOnline: false,
          lastMessage: "Thanks for the update.",
          lastMessageTime: new Date(Date.now() - 3 * 3600000).toISOString(),
          unread: 0,
        },
        {
          id: "ai-assistant1",
          name: "Tessa",
          specialty: "Technical Support",
          isAI: true,
          isOnline: true,
          lastMessage:
            "Hello! I can help with technical issues. What do you need assistance with?",
          lastMessageTime: new Date(Date.now() - 24 * 3600000).toISOString(),
          unread: 0,
        },
      ];

      const assistant = contacts.find((c) => c.id === contactId);
      const aiName = assistant?.name || "Assistant";
      const specialty = assistant?.specialty || "General";

      messages.push({
        id: `${contactId}-msg1`,
        contactId,
        senderId: contactId,
        text: `Hello! I'm ${aiName}, your ${specialty} assistant. How can I help you today?`,
        timestamp: this.randomTimestamp(),
        status: "read",
        isAI: true,
      });
    }

    // Sort messages by timestamp
    return messages.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
  }
}

// Create a singleton instance
const chatService = new ChatService();

// Export named functions to match imported functions in ChatContext.jsx
export const getContacts = (...args) => chatService.getContacts(...args);
export const getMessages = (...args) => chatService.getMessages(...args);
export const sendMessage = (...args) => chatService.sendMessage(...args);
export const markMessagesAsRead = (...args) =>
  chatService.markMessagesAsRead(...args);
export const createAIAssistant = (...args) =>
  chatService.createAIAssistant(...args);

export default chatService;
