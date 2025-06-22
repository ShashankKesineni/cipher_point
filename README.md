# CipherPoint 🔐

A secure, end-to-end encrypted messaging and location-based security app built with React Native and Expo.

## Features

### 🔒 **Encryption & Security**
- **Message Encryption**: Encrypt messages with custom passwords
- **Message Decryption**: Decrypt messages using message ID and password
- **End-to-End Encryption**: All messages are encrypted client-side
- **Location-Based Security**: Messages can be locked to specific GPS coordinates

### 💬 **Messaging System**
- **Friend Management**: Add and manage friends
- **User Search**: Search for users by name or email
- **Secure Conversations**: Encrypted messaging between friends
- **Location Requirements**: Messages can require being at a specific location to decrypt

### 📍 **Location Features**
- **GPS Integration**: Set and verify message locations
- **Address Search**: Search for locations using OpenStreetMap API
- **Distance Verification**: Messages unlock only when within 50 meters
- **Directions**: Get directions to message locations

### 🎨 **Modern UI/UX**
- **Clean Design**: Modern, intuitive interface
- **Responsive Layout**: Works on both iOS and Android
- **Accessibility**: Optimized for easy navigation
- **Branded Experience**: Consistent visual identity throughout

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Node.js with Express
- **Authentication**: JWT tokens
- **Encryption**: CryptoJS AES encryption
- **Maps**: React Native Maps
- **Location**: Expo Location
- **Social Login**: Apple Sign In (iOS), Google Sign In (standalone builds)
- **Deployment**: EAS Update for Expo Go, EAS Build for standalone apps

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Emulator

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ShashankKesineni/cipher_point.git
   cd cipher_point
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Expo CLI globally**
   ```bash
   npm install -g @expo/cli
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/simulator**
   - Scan QR code with Expo Go app
   - Press 'i' for iOS simulator
   - Press 'a' for Android emulator

## Usage

### Getting Started
1. **Create Account**: Sign up with email/password or use Apple Sign In (iOS)
2. **Add Friends**: Search for users and add them as friends
3. **Send Messages**: Create encrypted messages with location requirements
4. **Decrypt Messages**: Use passwords and location verification to read messages

### Key Features

#### **Message Encryption**
- Type your message and set a password
- Share the generated message ID with recipients
- Only those with the correct password can decrypt

#### **Location-Based Messages**
- Set a specific GPS location for your message
- Recipients must be within 50 meters to get the password
- Use address search or map selection for precise locations

#### **Friend Management**
- Search for users by name or email
- Add friends to start secure conversations
- Manage your friend list

## Deployment

### Expo Go (Development/Testing)
```bash
npx eas update --branch main
```

### Standalone Apps (Production)
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### App Store Deployment
```bash
# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

## API Endpoints

### Authentication
- `POST /signup` - Create new account
- `POST /login` - User login
- `POST /google-login` - Social login

### Messaging
- `POST /encrypt` - Encrypt a message
- `POST /decrypt` - Decrypt a message
- `POST /messages/send-location` - Send location-based message
- `POST /messages/get-password` - Get password for location-based message
- `POST /messages/decrypt-location` - Decrypt location-based message

### Friends & Users
- `GET /friends` - Get user's friends list
- `GET /users` - Search for users
- `POST /friends/add` - Add a friend
- `DELETE /friends/remove/:friendId` - Remove a friend

## Environment Variables

Create a `.env` file in the root directory:

```env
API_URL=https://your-backend-url.com
GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@cipherpoint.com or create an issue in this repository.

## Acknowledgments

- Expo team for the amazing development platform
- React Native community for excellent documentation
- OpenStreetMap for location services
- CryptoJS for encryption utilities

---
