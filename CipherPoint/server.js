//backend 
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

app.use(cors());
app.use(bodyParser.json());

const messages = {};
const users = {};
const friends = {}; 
const conversations = {}; 

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

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CipherPoint API is running' });
});

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (users[email]) {
    return res.status(409).json({ error: 'User already exists' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    users[email] = user;
    
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
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
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

app.post('/google-login', (req, res) => {
  const { googleToken, userInfo } = req.body;
  
  if (!userInfo || !userInfo.email) {
    return res.status(400).json({ error: 'Google user info required' });
  }
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

app.get('/users', authenticateToken, (req, res) => {
  const { search } = req.query;
  if (!search) {
    return res.status(400).json({ error: 'Search query required' });
  }
  
  const searchLower = search.toLowerCase();
  const searchResults = Object.values(users)
    .filter(user => 
      user.id !== req.user.userId && 
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
app.post('/friends/add', authenticateToken, (req, res) => {
  const { friendId } = req.body;
  if (!friendId) {
    return res.status(400).json({ error: 'Friend ID required' });
  }
  
  const friend = Object.values(users).find(u => u.id === friendId);
  if (!friend) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const userFriends = friends[req.user.userId] || [];
  if (userFriends.includes(friendId)) {
    return res.status(409).json({ error: 'Already friends' });
  }
  
  if (!friends[req.user.userId]) {
    friends[req.user.userId] = [];
  }
  friends[req.user.userId].push(friendId);
  
  if (!friends[friendId]) {
    friends[friendId] = [];
  }
  friends[friendId].push(req.user.userId);
  
  res.json({ message: 'Friend added successfully' });
});

app.delete('/friends/remove/:friendId', authenticateToken, (req, res) => {
  const { friendId } = req.params;
  
  if (friends[req.user.userId]) {
    friends[req.user.userId] = friends[req.user.userId].filter(id => id !== friendId);
  }
  
  if (friends[friendId]) {
    friends[friendId] = friends[friendId].filter(id => id !== req.user.userId);
  }
  
  res.json({ message: 'Friend removed successfully' });
});

app.post('/messages/send', authenticateToken, (req, res) => {
  const { recipientId, message, password } = req.body;
  if (!recipientId || !message || !password) {
    return res.status(400).json({ error: 'Recipient ID, message, and password required' });
  }
  
  const recipient = Object.values(users).find(u => u.id === recipientId);
  if (!recipient) {
    return res.status(404).json({ error: 'Recipient not found' });
  }
  
  const userFriends = friends[req.user.userId] || [];
  if (!userFriends.includes(recipientId)) {
    return res.status(403).json({ error: 'Can only send messages to friends' });
  }
  
  const encrypted = CryptoJS.AES.encrypt(message, password).toString();
  
  const conversationId = [req.user.userId, recipientId].sort().join('-');
  
  if (!conversations[conversationId]) {
    conversations[conversationId] = [];
  }
  
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

app.get('/messages/conversation/:friendId', authenticateToken, (req, res) => {
  const { friendId } = req.params;
  
  const userFriends = friends[req.user.userId] || [];
  if (!userFriends.includes(friendId)) {
    return res.status(403).json({ error: 'Can only view conversations with friends' });
  }
  
  const conversationId = [req.user.userId, friendId].sort().join('-');
  const conversation = conversations[conversationId] || [];
  
  const formattedMessages = conversation.map(msg => ({
    id: msg.id,
    isFromMe: msg.senderId === req.user.userId,
    timestamp: msg.timestamp,
    location: msg.location || null
  }));
  
  res.json({ messages: formattedMessages });
});

app.post('/messages/decrypt', authenticateToken, (req, res) => {
  const { messageId, password } = req.body;
  if (!messageId || !password) {
    return res.status(400).json({ error: 'Message ID and password required' });
  }
  
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

//bunch of checks to make sure user inpts proper info
app.post('/messages/send-location', authenticateToken, (req, res) => {
  const { recipientId, message, password, location } = req.body;
  if (!recipientId || !message || !password || !location) {
    return res.status(400).json({ error: 'Recipient ID, message, password, and location are required' });
  }
  
  const recipient = Object.values(users).find(u => u.id === recipientId);
  if (!recipient) {
    return res.status(404).json({ error: 'Recipient not found' });
  }
  
  const userFriends = friends[req.user.userId] || [];
  if (!userFriends.includes(recipientId)) {
    return res.status(403).json({ error: 'Can only send messages to friends' });
  }
  
  if (!location.latitude || !location.longitude || !location.name) {
    return res.status(400).json({ error: 'Invalid location data' });
  }
  
  const encrypted = CryptoJS.AES.encrypt(message, password).toString();
  
  const conversationId = [req.user.userId, recipientId].sort().join('-');
  
  if (!conversations[conversationId]) {
    conversations[conversationId] = [];
  }
  
  const messageData = {
    id: uuidv4(),
    senderId: req.user.userId,
    recipientId: recipientId,
    encrypted: encrypted,
    location: location,
    password: password,
    timestamp: new Date().toISOString()
  };
  
  conversations[conversationId].push(messageData);
  
  res.json({ 
    message: 'Location-based message sent successfully', 
    messageId: messageData.id,
    location: location
  });
});

app.post('/messages/get-password', authenticateToken, (req, res) => {
  const { messageId, latitude, longitude } = req.body;
  if (!messageId || !latitude || !longitude) {
    return res.status(400).json({ error: 'Message ID and current location required' });
  }
  
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
  
  if (messageData.recipientId !== req.user.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  //mthd to get distance of required location
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

app.post('/messages/decrypt-location', authenticateToken, (req, res) => {
  const { messageId, password } = req.body;
  if (!messageId || !password) {
    return res.status(400).json({ error: 'Message ID and password required' });
  }
  
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
  
  if (messageData.recipientId !== req.user.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (messageData.password !== password) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(messageData.encrypted, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Decryption failed');

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

//math function that goes in the location mthd calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const o1 = lat1 * Math.PI / 180;
  const o2 = lat2 * Math.PI / 180;
  const Do = (lat2 - lat1) * Math.PI / 180;
  const Ds = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Do / 2) * Math.sin(Do / 2) +
    Math.cos(o1) * Math.cos(o2) *
    Math.sin(Ds / 2) * Math.sin(Ds / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.listen(port, () => {
  console.log(`CipherPoint server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
}); 
