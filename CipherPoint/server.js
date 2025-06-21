const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors());
app.use(bodyParser.json());

// In-memory storage for messages and users
const messages = {};
const users = {};

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

app.listen(port, () => {
  console.log(`CipherPoint server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
}); 