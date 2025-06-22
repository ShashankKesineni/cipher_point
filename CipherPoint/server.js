const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

app.use(cors());
app.use(bodyParser.json());

// In-memory storage for messages and users
const messages = {};
const users = {};
const friends = {}; // userId -> [friendIds]
const conversations = {}; // conversationId -> [messages]

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CipherPoint API is running' });
});

// User signup
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // Check if user already exists
  if (users[email]) {
    return res.status(409).json({ error: 'User already exists' });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    users[email] = user;
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users[email];
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error during login' });
  }
});

// Google OAuth login (simplified - you'd need to implement proper Google OAuth)
app.post('/google-login', (req, res) => {
  const { googleToken, userInfo } = req.body;
  
  if (!userInfo || !userInfo.email) {
    return res.status(400).json({ error: 'Google user info required' });
  }

  // Check if user exists, if not create them
  let user = users[userInfo.email];
  if (!user) {
    user = {
      id: uuidv4(),
      name: userInfo.name || userInfo.email,
      email: userInfo.email,
      googleId: userInfo.googleId,
      createdAt: new Date().toISOString()
    };
    users[userInfo.email] = user;
  }
  
  // Generate JWT token
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  
  res.json({
    message: 'Google login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

// Get user profile (protected route)
app.get('/profile', authenticateToken, (req, res) => {
  const user = users[req.user.email];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

// Encrypt and store message (protected route)
app.post('/encrypt', authenticateToken, (req, res) => {
  const { message, password } = req.body;
  if (!message || !password) {
    return res.status(400).json({ error: 'Message and password are required.' });
  }
  const encrypted = CryptoJS.AES.encrypt(message, password).toString();
  const id = uuidv4();
  messages[id] = {
    encrypted,
    userId: req.user.userId,
    createdAt: new Date().toISOString()
  };
  res.json({ id });
});

// Decrypt message by ID and password (protected route)
app.post('/decrypt', authenticateToken, (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) {
    return res.status(400).json({ error: 'ID and password are required.' });
  }
  const messageData = messages[id];
  if (!messageData) {
    return res.status(404).json({ error: 'Message not found.' });
  }
  try {
    const bytes = CryptoJS.AES.decrypt(messageData.encrypted, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Wrong password');
    res.json({ message: decrypted });
  } catch (e) {
    res.status(401).json({ error: 'Invalid password or message.' });
  }
});

// Friends management endpoints

// Get user's friends list
app.get('/friends', authenticateToken, (req, res) => {
  const userFriends = friends[req.user.userId] || [];
  const friendsList = userFriends.map(friendId => {
    const friend = Object.values(users).find(u => u.id === friendId);
    return friend ? {
      id: friend.id,
      name: friend.name,
      email: friend.email
    } : null;
  }).filter(Boolean);
  
  res.json({ friends: friendsList });
});

// Search users by name or email
app.get('/users', authenticateToken, (req, res) => {
  const { search } = req.query;
  if (!search) {
    return res.status(400).json({ error: 'Search query required' });
  }
  
  const searchLower = search.toLowerCase();
  const searchResults = Object.values(users)
    .filter(user => 
      user.id !== req.user.userId && // Exclude current user
      (user.name.toLowerCase().includes(searchLower) || 
       user.email.toLowerCase().includes(searchLower))
    )
    .map(user => ({
      id: user.id,
      name: user.name,
      email: user.email
    }));
  
  res.json({ users: searchResults });
});

// Add friend
app.post('/friends/add', authenticateToken, (req, res) => {
  const { friendId } = req.body;
  if (!friendId) {
    return res.status(400).json({ error: 'Friend ID required' });
  }
  
  // Check if friend exists
  const friend = Object.values(users).find(u => u.id === friendId);
  if (!friend) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Check if already friends
  const userFriends = friends[req.user.userId] || [];
  if (userFriends.includes(friendId)) {
    return res.status(409).json({ error: 'Already friends' });
  }
  
  // Add friend
  if (!friends[req.user.userId]) {
    friends[req.user.userId] = [];
  }
  friends[req.user.userId].push(friendId);
  
  // Add reverse friendship
  if (!friends[friendId]) {
    friends[friendId] = [];
  }
  friends[friendId].push(req.user.userId);
  
  res.json({ message: 'Friend added successfully' });
});

// Remove friend
app.delete('/friends/remove/:friendId', authenticateToken, (req, res) => {
  const { friendId } = req.params;
  
  // Remove from current user's friends
  if (friends[req.user.userId]) {
    friends[req.user.userId] = friends[req.user.userId].filter(id => id !== friendId);
  }
  
  // Remove from friend's friends
  if (friends[friendId]) {
    friends[friendId] = friends[friendId].filter(id => id !== req.user.userId);
  }
  
  res.json({ message: 'Friend removed successfully' });
});

// Messaging endpoints

// Send message
app.post('/messages/send', authenticateToken, (req, res) => {
  const { recipientId, message, password } = req.body;
  if (!recipientId || !message || !password) {
    return res.status(400).json({ error: 'Recipient ID, message, and password required' });
  }
  
  // Check if recipient exists
  const recipient = Object.values(users).find(u => u.id === recipientId);
  if (!recipient) {
    return res.status(404).json({ error: 'Recipient not found' });
  }
  
  // Check if they are friends
  const userFriends = friends[req.user.userId] || [];
  if (!userFriends.includes(recipientId)) {
    return res.status(403).json({ error: 'Can only send messages to friends' });
  }
  
  // Encrypt message
  const encrypted = CryptoJS.AES.encrypt(message, password).toString();
  
  // Create conversation ID (sorted to ensure consistency)
  const conversationId = [req.user.userId, recipientId].sort().join('-');
  
  // Initialize conversation if it doesn't exist
  if (!conversations[conversationId]) {
    conversations[conversationId] = [];
  }
  
  // Add message to conversation
  const messageData = {
    id: uuidv4(),
    senderId: req.user.userId,
    recipientId: recipientId,
    encrypted: encrypted,
    timestamp: new Date().toISOString()
  };
  
  conversations[conversationId].push(messageData);
  
  res.json({ message: 'Message sent successfully', messageId: messageData.id });
});

// Get conversation messages
app.get('/messages/conversation/:friendId', authenticateToken, (req, res) => {
  const { friendId } = req.params;
  
  // Check if they are friends
  const userFriends = friends[req.user.userId] || [];
  if (!userFriends.includes(friendId)) {
    return res.status(403).json({ error: 'Can only view conversations with friends' });
  }
  
  // Get conversation
  const conversationId = [req.user.userId, friendId].sort().join('-');
  const conversation = conversations[conversationId] || [];
  
  // Format messages for frontend
  const formattedMessages = conversation.map(msg => ({
    id: msg.id,
    isFromMe: msg.senderId === req.user.userId,
    timestamp: msg.timestamp,
    location: msg.location || null // Include location data if it exists
  }));
  
  res.json({ messages: formattedMessages });
});

// Decrypt message
app.post('/messages/decrypt', authenticateToken, (req, res) => {
  const { messageId, password } = req.body;
  if (!messageId || !password) {
    return res.status(400).json({ error: 'Message ID and password required' });
  }
  
  // Find message in conversations
  let messageData = null;
  for (const conversationId in conversations) {
    const message = conversations[conversationId].find(m => m.id === messageId);
    if (message) {
      messageData = message;
      break;
    }
  }
  
  if (!messageData) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  // Check if user is part of the conversation
  const conversationId = [messageData.senderId, messageData.recipientId].sort().join('-');
  const userFriends = friends[req.user.userId] || [];
  const isParticipant = messageData.senderId === req.user.userId || messageData.recipientId === req.user.userId;
  const isFriend = userFriends.includes(messageData.senderId) || userFriends.includes(messageData.recipientId);
  
  if (!isParticipant || !isFriend) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(messageData.encrypted, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Wrong password');
    res.json({ message: decrypted });
  } catch (e) {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Location-based messaging endpoints

// Send location-based message
app.post('/messages/send-location', authenticateToken, (req, res) => {
  const { recipientId, message, password, location } = req.body;
  if (!recipientId || !message || !password || !location) {
    return res.status(400).json({ error: 'Recipient ID, message, password, and location are required' });
  }
  
  // Check if recipient exists
  const recipient = Object.values(users).find(u => u.id === recipientId);
  if (!recipient) {
    return res.status(404).json({ error: 'Recipient not found' });
  }
  
  // Check if they are friends
  const userFriends = friends[req.user.userId] || [];
  if (!userFriends.includes(recipientId)) {
    return res.status(403).json({ error: 'Can only send messages to friends' });
  }
  
  // Validate location data
  if (!location.latitude || !location.longitude || !location.name) {
    return res.status(400).json({ error: 'Invalid location data' });
  }
  
  // Encrypt message
  const encrypted = CryptoJS.AES.encrypt(message, password).toString();
  
  // Create conversation ID (sorted to ensure consistency)
  const conversationId = [req.user.userId, recipientId].sort().join('-');
  
  // Initialize conversation if it doesn't exist
  if (!conversations[conversationId]) {
    conversations[conversationId] = [];
  }
  
  // Add message to conversation with location data
  const messageData = {
    id: uuidv4(),
    senderId: req.user.userId,
    recipientId: recipientId,
    encrypted: encrypted,
    location: location,
    password: password, // Store password for location verification
    timestamp: new Date().toISOString()
  };
  
  conversations[conversationId].push(messageData);
  
  res.json({ 
    message: 'Location-based message sent successfully', 
    messageId: messageData.id,
    location: location
  });
});

// Get message password when at location
app.post('/messages/get-password', authenticateToken, (req, res) => {
  const { messageId, latitude, longitude } = req.body;
  if (!messageId || !latitude || !longitude) {
    return res.status(400).json({ error: 'Message ID and current location required' });
  }
  
  // Find message in conversations
  let messageData = null;
  for (const conversationId in conversations) {
    const message = conversations[conversationId].find(m => m.id === messageId);
    if (message) {
      messageData = message;
      break;
    }
  }
  
  if (!messageData) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  // Check if user is the intended recipient
  if (messageData.recipientId !== req.user.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Check if user is close enough to the location (within 50 meters)
  const distance = calculateDistance(
    latitude, 
    longitude, 
    messageData.location.latitude, 
    messageData.location.longitude
  );
  
  if (distance > 50) {
    return res.status(403).json({ 
      error: 'You must be within 50 meters of the location to receive the password',
      distance: Math.round(distance)
    });
  }
  
  res.json({ 
    password: messageData.password,
    location: messageData.location,
    distance: Math.round(distance)
  });
});

// Decrypt location-based message
app.post('/messages/decrypt-location', authenticateToken, (req, res) => {
  const { messageId, password } = req.body;
  if (!messageId || !password) {
    return res.status(400).json({ error: 'Message ID and password required' });
  }
  
  // Find message in conversations
  let messageData = null;
  let conversationId = null;
  for (const convId in conversations) {
    const message = conversations[convId].find(m => m.id === messageId);
    if (message) {
      messageData = message;
      conversationId = convId;
      break;
    }
  }
  
  if (!messageData) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  // Check if user is the intended recipient
  if (messageData.recipientId !== req.user.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Verify password
  if (messageData.password !== password) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(messageData.encrypted, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Decryption failed');
    
    // Remove message after successful decryption
    if (conversationId) {
      conversations[conversationId] = conversations[conversationId].filter(m => m.id !== messageId);
    }
    
    res.json({ 
      message: decrypted,
      location: messageData.location,
      timestamp: messageData.timestamp
    });
  } catch (e) {
    res.status(401).json({ error: 'Decryption failed' });
  }
});

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

app.listen(port, () => {
  console.log(`CipherPoint server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
}); 