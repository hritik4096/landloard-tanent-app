import React, { createContext, useContext, useState, useEffect, useCallback, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import webSocketService from '../services/websocketService';
import apiService from '../services/apiService';
import { getContacts, getMessages, sendMessage } from '../services/chatService';
import { connectWebSocket } from '../services/websocketService';

// Initial state
const initialState = {
  contacts: [],
  messages: {},
  activeContactId: null,
  typingUsers: {},
  status: 'disconnected',
  isLoading: true,
  error: null,
  creatingAssistant: false
};

// Action types
const ActionTypes = {
  SET_CONTACTS: 'SET_CONTACTS',
  ADD_CONTACT: 'ADD_CONTACT',
  UPDATE_CONTACT: 'UPDATE_CONTACT',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  SET_ACTIVE_CONTACT: 'SET_ACTIVE_CONTACT',
  SET_TYPING: 'SET_TYPING',
  SET_STATUS: 'SET_STATUS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  MARK_READ: 'MARK_READ'
};

// Reducer function
function chatReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_CONTACTS:
      return { ...state, contacts: action.payload };
      
    case ActionTypes.ADD_CONTACT:
      return { 
        ...state, 
        contacts: [...state.contacts, action.payload] 
      };
      
    case ActionTypes.UPDATE_CONTACT:
      return { 
        ...state, 
        contacts: state.contacts.map(contact => 
          contact.id === action.payload.id ? { ...contact, ...action.payload } : contact
        ) 
      };
      
    case ActionTypes.SET_MESSAGES:
      return { ...state, messages: action.payload };
      
    case ActionTypes.ADD_MESSAGE:
      const { contactId, message } = action.payload;
      return { 
        ...state, 
        messages: {
          ...state.messages,
          [contactId]: [...(state.messages[contactId] || []), message]
        }
      };
      
    case ActionTypes.UPDATE_MESSAGE:
      const { contactId: cId, messageId, updates } = action.payload;
      return { 
        ...state, 
        messages: {
          ...state.messages,
          [cId]: state.messages[cId].map(msg => 
            msg.id === messageId ? { ...msg, ...updates } : msg
          )
        }
      };
      
    case ActionTypes.SET_ACTIVE_CONTACT:
      return { ...state, activeContactId: action.payload };
      
    case ActionTypes.SET_TYPING:
      return { 
        ...state, 
        typingUsers: {
          ...state.typingUsers,
          [action.payload.contactId]: action.payload.isTyping
        }
      };
      
    case ActionTypes.SET_STATUS:
      return { ...state, status: action.payload };
      
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
      
    case ActionTypes.MARK_READ:
      const readContactId = action.payload;
      return { 
        ...state, 
        contacts: state.contacts.map(contact => 
          contact.id === readContactId ? { ...contact, unread: 0 } : contact
        ),
        messages: {
          ...state.messages,
          [readContactId]: (state.messages[readContactId] || []).map(msg => 
            msg.senderId !== 'currentUser' ? { ...msg, status: 'read' } : msg
          )
        }
      };
      
    case ActionTypes.SET_CREATING_ASSISTANT:
      return { ...state, creatingAssistant: action.payload };
      
    default:
      return state;
  }
}

// Create context
const ChatContext = createContext();

// Context provider
export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [ws, setWs] = useState({ url: 'ws://localhost:5000/chat' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize websocket connection
  useEffect(() => {
    const socket = connectWebSocket({
      onMessage: handleSocketMessage,
      onOpen: () => dispatch({ type: ActionTypes.SET_STATUS, payload: 'connected' }),
      onClose: () => dispatch({ type: ActionTypes.SET_STATUS, payload: 'disconnected' }),
      onError: () => {
        dispatch({ type: ActionTypes.SET_STATUS, payload: 'error' });
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Connection to chat server failed' });
      }
    });

    return () => {
      if (socket) socket.close();
    };
  }, []);

  // Load contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const contactsData = await getContacts();
        dispatch({ type: ActionTypes.SET_CONTACTS, payload: contactsData });
      } catch (err) {
        console.error('Failed to load contacts:', err);
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to load contacts. Please try again.' });
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    };

    loadContacts();
  }, []);

  // Load messages when active contact changes
  useEffect(() => {
    if (!state.activeContactId) return;

    const loadMessages = async () => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const messagesData = await getMessages(state.activeContactId);
        
        // Format messages with dates
        const formattedMessages = messagesData.map(msg => ({
          ...msg,
          date: formatMessageDate(msg.timestamp)
        }));
        
        dispatch({ 
          type: ActionTypes.SET_MESSAGES, 
          payload: { 
            ...state.messages, 
            [state.activeContactId]: formattedMessages 
          } 
        });
        
        // Mark messages as read
        dispatch({ type: ActionTypes.MARK_READ, payload: state.activeContactId });
      } catch (err) {
        console.error('Failed to load messages:', err);
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to load messages. Please try again.' });
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    };

    loadMessages();
  }, [state.activeContactId]);

  const handleSocketMessage = useCallback((data) => {
    const { type, payload } = data;

    switch (type) {
      case 'new_message':
        handleNewMessage(payload);
        break;
      case 'typing_status':
        handleTypingStatus(payload);
        break;
      case 'user_status':
        handleUserStatus(payload);
        break;
      case 'new_contact':
        dispatch({ type: ActionTypes.ADD_CONTACT, payload });
        break;
      default:
        console.log('Unhandled message type:', type);
    }
  }, []);

  const handleNewMessage = useCallback((message) => {
    // If message is for active contact, add to messages
    if (state.activeContactId && message.contactId === state.activeContactId) {
      dispatch({ 
        type: ActionTypes.ADD_MESSAGE, 
        payload: { contactId: state.activeContactId, message } 
      });
    } else {
      // Increment unread count for contact
      dispatch({
        type: ActionTypes.UPDATE_CONTACT,
        payload: {
          id: message.contactId,
          unread: (state.contacts.find(c => c.id === message.contactId)?.unread + 1) || 1
        }
      });
    }
    
    // Update last message for contact
    dispatch({
      type: ActionTypes.UPDATE_CONTACT,
      payload: {
        id: message.contactId,
        lastMessage: message.text,
        time: formatMessageTime(message.timestamp || Date.now()),
        unread: state.activeContactId === message.contactId ? 0 : (
          state.contacts.find(c => c.id === message.contactId)?.unread + 1 || 1
        )
      }
    });
  }, [state.activeContactId, state.contacts]);

  const handleTypingStatus = useCallback(({ contactId, isTyping }) => {
    dispatch({ 
      type: ActionTypes.SET_TYPING, 
      payload: { 
        contactId, 
        isTyping 
      }
    });
    
    // Auto-clear typing indicator after 3 seconds of inactivity
    if (isTyping) {
      setTimeout(() => {
        dispatch({ 
          type: ActionTypes.SET_TYPING, 
          payload: { 
            contactId, 
            isTyping: false 
          }
        });
      }, 3000);
    }
  }, []);

  const handleUserStatus = useCallback(({ contactId, isOnline }) => {
    dispatch({ 
      type: ActionTypes.UPDATE_CONTACT,
      payload: {
        id: contactId,
        isOnline
      }
    });
  }, []);

  // Set up WebSocket listeners



  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(e => console.log('Could not play notification sound'));
  };


  // Format message date
  const formatMessageDate = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get messages for a specific contact
  const getContactMessages = useCallback((contactId) => {
    return state.messages[contactId] || [];
  }, [state.messages]);

  // Fetch messages for a contact
  const fetchMessages = useCallback(async (contactId) => {
    if (!contactId) return;
    
    // Only fetch if we don't already have messages for this contact
    if (state.messages[contactId] && state.messages[contactId].length > 0) {
      return;
    }
    
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    try {
      const messages = await apiService.getMessages(contactId);
      
      // Format messages
      const formattedMessages = messages.map(msg => ({
        ...msg,
        date: formatMessageDate(msg.timestamp)
      }));
      
      // Add messages to state
      dispatch({ 
        type: ActionTypes.SET_MESSAGES, 
        payload: { 
          ...state.messages, 
          [contactId]: formattedMessages 
        } 
      });
    } catch (error) {
      console.error(`Error fetching messages for contact ${contactId}:`, error);
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: `Failed to load messages for this conversation` 
      });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, [state.messages]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (contactId) => {
    // Update local state
    dispatch({ type: ActionTypes.MARK_READ, payload: contactId });
    
    // Send read receipt to server
    try {
      await apiService.markMessagesAsRead(contactId);
    } catch (error) {
      console.error(`Error marking messages as read for contact ${contactId}:`, error);
    }
  }, []);

  // Set active contact
  const setActiveContact = useCallback((contactId) => {
    dispatch({ type: ActionTypes.SET_ACTIVE_CONTACT, payload: contactId });
  }, []);

  // Send message
  const sendMessageToContact = async (text) => {
    if (!state.activeContactId) return;
    
    try {
      // Optimistically add message to UI
      const tempMessage = {
        id: `temp-${Date.now()}`,
        contactId: state.activeContactId,
        senderId: 'currentUser',
        text,
        timestamp: new Date().toISOString(),
        status: 'sending'
      };
      
      dispatch({ 
        type: ActionTypes.ADD_MESSAGE, 
        payload: { contactId: state.activeContactId, message: tempMessage } 
      });
      
      // Send message to API
      const sentMessage = await sendMessage(state.activeContactId, text);
      
      // Replace temp message with actual message
      dispatch({ 
        type: ActionTypes.UPDATE_MESSAGE, 
        payload: { 
          contactId: state.activeContactId, 
          messageId: tempMessage.id, 
          updates: { 
            status: 'delivered',
            id: sentMessage.id || tempMessage.id
          }
        } 
      });
      
      // Update contact's last message
      dispatch({ 
        type: ActionTypes.UPDATE_CONTACT,
        payload: {
          id: state.activeContactId,
          lastMessage: text,
          time: formatMessageTime(sentMessage.timestamp),
          unread: 0
        }
      });
      
      return sentMessage;
    } catch (err) {
      console.error('Failed to send message:', err);
      dispatch({ 
        type: ActionTypes.UPDATE_MESSAGE, 
        payload: { 
          contactId: state.activeContactId, 
          messageId: tempMessage.id, 
          updates: { status: 'failed' }
        } 
      });
      
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: 'Failed to send message. Please try again.' 
      });
      
      return null;
    }
  };

  // Send typing indicator
  const sendTypingIndicator = useCallback((contactId, isTyping) => {
    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Send the typing status via WebSocket
    webSocketService.sendTyping({
      recipientId: contactId,
      isTyping
    });
    
    // Set a timeout to automatically set typing to false after a period
    if (isTyping) {
      const timeout = setTimeout(() => {
        webSocketService.sendTyping({
          recipientId: contactId,
          isTyping: false
        });
      }, 5000);
      
      setTypingTimeout(timeout);
    }
  }, [typingTimeout]);

  // Process AI response - simulated for now, can be replaced with actual API call
  const processAIResponse = useCallback(async (contactId, userMessage) => {
    // Set typing indicator for AI
    dispatch({ 
      type: ActionTypes.SET_TYPING, 
      payload: { 
        contactId, 
        isTyping: true 
      }
    });
    
    try {
      // Simulate AI processing time - variable timing for realism
      const processingTime = 800 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Get AI assistant details to personalize response
      const aiAssistant = state.contacts.find(c => c.id === contactId);
      const specialty = aiAssistant?.specialty || 'general';
      
      // Generate a more contextual response based on user message
      let response = "";
      const lowerCaseMessage = userMessage.toLowerCase();
      
      // Check for greetings
      if (lowerCaseMessage.match(/^(hi|hello|hey|greetings).*/i)) {
        response = `Hello there! I'm your ${specialty} assistant. How can I help you today?`;
      }
      // Check for questions about what the assistant can do
      else if (lowerCaseMessage.includes("what can you do") || lowerCaseMessage.includes("help me with")) {
        if (specialty === "general") {
          response = "I can help you with a wide range of topics including answering questions, providing information, or just chatting. What would you like to know?";
        } else {
          response = `As your ${specialty} assistant, I can help you with anything related to ${specialty}. What specific assistance do you need?`;
        }
      }
      // Check for thank you messages
      else if (lowerCaseMessage.match(/(thank|thanks|thx|appreciate it)/i)) {
        response = "You're welcome! Is there anything else I can assist you with?";
      }
      // Check for goodbye messages
      else if (lowerCaseMessage.match(/(bye|goodbye|see you|talk to you later)/i)) {
        response = "Goodbye! Feel free to message me anytime you need assistance.";
      }
      // Check for specific topics
      else if (lowerCaseMessage.includes("weather")) {
        response = "I don't have real-time weather data, but I'd be happy to discuss the weather forecast if you had access to that information.";
      }
      else if (lowerCaseMessage.includes("time")) {
        response = `The current time is ${new Date().toLocaleTimeString()}.`;
      }
      else if (lowerCaseMessage.includes("date")) {
        response = `Today is ${new Date().toLocaleDateString()}.`;
      }
      // Direct response to user's message
      else {
        // Split user message into words for analysis
        const words = userMessage.split(/\s+/);
        
        if (words.length <= 3) {
          // Short query
          response = `I understand you're asking about "${userMessage}". Can you provide more details so I can help you better?`;
        } else {
          // Try to extract keywords from longer messages
          const keywords = words.filter(word => word.length > 4).slice(0, 3);
          
          if (keywords.length > 0) {
            response = `I see you're interested in ${keywords.join(", ")}. As your ${specialty} assistant, I'm here to help with that. Could you tell me more specifically what you're looking for?`;
          } else {
            // Generic response
            response = `Thank you for your message. I'm processing your request about "${userMessage.substring(0, 30)}...". How else can I assist you with ${specialty} topics?`;
          }
        }
      }
      
      // Create AI message with the generated response
      const aiMessage = {
        id: uuidv4(),
        contactId,
        senderId: contactId,
        text: response,
        timestamp: new Date().toISOString(),
        status: 'delivered',
        isAI: true,
        date: formatMessageDate(new Date())
      };
      
      // Update messages state directly 
      if (state.activeContactId === contactId) {
        dispatch({ 
          type: ActionTypes.ADD_MESSAGE, 
          payload: { contactId, message: aiMessage } 
        });
      }
      
      // Also update in the messages object via reducer
      dispatch({ 
        type: ActionTypes.ADD_MESSAGE, 
        payload: { contactId, message: aiMessage } 
      });
      
      // Update contact's last message
      dispatch({ 
        type: ActionTypes.UPDATE_CONTACT,
        payload: {
          id: contactId,
          lastMessage: response,
          time: formatMessageTime(aiMessage.timestamp),
          unread: 0
        }
      });
      
    } catch (error) {
      console.error('Error processing AI message:', error);
      
      // Add error message
      const errorMessage = {
        id: uuidv4(),
        contactId,
        senderId: contactId,
        text: "Sorry, I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date().toISOString(),
        status: 'delivered',
        isAI: true,
        isError: true,
        date: formatMessageDate(new Date())
      };
      
      // Update messages state directly
      if (state.activeContactId === contactId) {
        dispatch({ 
          type: ActionTypes.ADD_MESSAGE, 
          payload: { contactId, message: errorMessage } 
        });
      }
      
      // Also update in the messages object via reducer
      dispatch({ 
        type: ActionTypes.ADD_MESSAGE, 
        payload: { contactId, message: errorMessage } 
      });
    } finally {
      // Stop typing indicator after a short delay for realism
      setTimeout(() => {
        dispatch({ 
          type: ActionTypes.SET_TYPING, 
          payload: { 
            contactId, 
            isTyping: false 
          }
        });
      }, 500);
    }
  }, [state.activeContactId, state.contacts]);

  // Retry sending a failed message
  const retryMessage = useCallback(async (contactId, messageId) => {
    const message = state.messages[contactId]?.find(msg => msg.id === messageId);
    
    if (!message) {
      console.error('Message not found for retry');
      return;
    }
    
    // Update status to sending
    dispatch({
      type: ActionTypes.UPDATE_MESSAGE,
      payload: {
        contactId,
        messageId,
        updates: { status: 'sending' }
      }
    });
    
    // Re-send the message
    try {
      const result = await apiService.sendMessage(
        contactId, 
        message.text, 
        message.attachment
      );
      
      // Update with success status
      dispatch({
        type: ActionTypes.UPDATE_MESSAGE,
        payload: {
          contactId,
          messageId,
          updates: { 
            status: 'delivered',
            id: result.id || messageId
          }
        }
      });
      
    } catch (error) {
      console.error('Error retrying message:', error);
      
      // Update status to failed again
      dispatch({
        type: ActionTypes.UPDATE_MESSAGE,
        payload: {
          contactId,
          messageId,
          updates: { status: 'failed' }
        }
      });
      
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: 'Failed to send message. Please try again.' 
      });
    }
  }, [state.messages]);

  // Delete message
  const deleteMessage = useCallback(async (contactId, messageId) => {
    // Optimistically remove from UI
    const currentMessages = [...(state.messages[contactId] || [])];
    const updatedMessages = currentMessages.filter(msg => msg.id !== messageId);
    
    dispatch({ 
      type: ActionTypes.SET_MESSAGES, 
      payload: { 
        ...state.messages, 
        [contactId]: updatedMessages 
      } 
    });
    
    // Update last message in contact if needed
    if (currentMessages.length > 0 && currentMessages[currentMessages.length - 1].id === messageId) {
      const newLastMessage = updatedMessages.length > 0 
        ? updatedMessages[updatedMessages.length - 1]
        : null;
      
      if (newLastMessage) {
        dispatch({
          type: ActionTypes.UPDATE_CONTACT,
          payload: {
            id: contactId,
            lastMessage: newLastMessage.text || 'Attachment',
            time: formatMessageTime(newLastMessage.timestamp)
          }
        });
      }
    }
    
    // Call API to delete the message
    try {
      // API call would go here in a real implementation
      // await apiService.deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      
      // Restore the message if delete fails
      dispatch({ 
        type: ActionTypes.SET_MESSAGES, 
        payload: { 
          ...state.messages, 
          [contactId]: currentMessages 
        } 
      });
      
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: 'Failed to delete message. Please try again.' 
      });
    }
  }, [state.messages]);

  // Create a new AI assistant
  const createAIAssistant = useCallback(async (name, specialty) => {
    try {
      // Show loading state
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // In a real app, this would call an API
      const newAssistant = {
        id: `ai-${Date.now()}`,
        name,
        specialty,
        isAI: true,
        isOnline: true,
        lastMessage: `Hello, I'm ${name}, your AI assistant for ${specialty}. How can I help you today?`,
        lastMessageTime: new Date().toISOString(),
        unread: 0
      };
      
      // Add to contacts
      dispatch({ type: ActionTypes.ADD_CONTACT, payload: newAssistant });
      
      // Create initial message
     
      
      // Create a new messages array for this contact
      const newMessages = [initialMessage];
      dispatch({ type: ActionTypes.SET_MESSAGES, payload: { [newAssistant.id]: newMessages } });
      
      // Set as active contact
      dispatch({ type: ActionTypes.SET_ACTIVE_CONTACT, payload: newAssistant.id });
      
      // Done loading
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      
      return newAssistant;
    } catch (err) {
      console.error('Failed to create AI assistant:', err);
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: 'Failed to create AI assistant. Please try again.' 
      });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      return null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: null });
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

  // Context value
  const value = {
    contacts: state.contacts,
    messages: state.messages,
    activeContactId: state.activeContactId,
    typingUsers: state.typingUsers,
    typingContacts: Object.keys(state.typingUsers).filter(id => state.typingUsers[id]),
    status: state.status,
    connectionStatus: state.status,
    isLoading: state.isLoading,
    loading: state.isLoading,
    error: state.error,
    getContactMessages,
    sendMessage: sendMessageToContact,
    sendTypingIndicator,
    setActiveContact,
    markMessagesAsRead,
    createAIAssistant,
    retryMessage,
    deleteMessage,
    clearError,
    fetchMessages,
    reconnect: () => {
      const token = localStorage.getItem('token');
      if (token && ws.url) {
        setupWebSocketConnection(token);
      }
    },
    creatingAssistant: state.creatingAssistant,
    isMobileMenuOpen,
    toggleMobileMenu
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 