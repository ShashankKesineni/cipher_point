# 🌐 CipherPoint Deployment Guide

## Cross-Device Communication Setup

To enable communication between different devices, you need to deploy your backend server to the cloud.

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended - Free)

1. **Sign up at [Railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Deploy automatically**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Option 2: Render (Free Tier)

1. **Sign up at [Render.com](https://render.com)**
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Set environment variables:**
   - `PORT`: 10000
   - `JWT_SECRET`: your-secret-key-here

### Option 3: Heroku (Free Tier Discontinued)

1. **Sign up at [Heroku.com](https://heroku.com)**
2. **Install Heroku CLI**
3. **Deploy:**

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login

# Create app
heroku create your-cipherpoint-app

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key-here

# Deploy
git push heroku main
```

## 🔧 Environment Variables

Set these in your cloud platform:

```env
PORT=10000
JWT_SECRET=your-super-secret-jwt-key-change-this
```

## 📱 Update Frontend

After deployment, update your `App.js`:

```javascript
// Replace this line:
const API_URL = 'http://192.168.86.28:3001';

// With your cloud URL:
const API_URL = 'https://your-app-name.railway.app';
// or
const API_URL = 'https://your-app-name.onrender.com';
// or
const API_URL = 'https://your-app-name.herokuapp.com';
```

## 🌍 Cross-Device Communication

Once deployed:

1. **User A** (iPhone) encrypts a message → gets message ID
2. **User A** shares message ID with **User B** (Android)
3. **User B** uses message ID + password to decrypt
4. **Works from anywhere in the world!**

## 🔒 Security Notes

- Change `JWT_SECRET` to a strong random string
- Consider adding rate limiting
- Add HTTPS (automatic on most cloud platforms)
- Consider database storage for production

## 📊 Monitoring

- Railway: Built-in logs and metrics
- Render: Logs and uptime monitoring
- Heroku: Logs and add-ons for monitoring

## 🚨 Important

- **In-memory storage**: Data is lost when server restarts
- **For production**: Use a database (MongoDB, PostgreSQL)
- **Backup**: Regular backups of user data
- **Scaling**: Cloud platforms auto-scale based on traffic 