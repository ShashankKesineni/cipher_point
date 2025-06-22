import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ScrollView, TouchableOpacity, Platform } from 'react-native';
import HomeScreen from './HomeScreen';
import MessagingScreen from './MessagingScreen';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Ellipse } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuthRequest, makeRedirectUri, ResponseType } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';

const API_URL = 'https://cipherpoint-production.up.railway.app';
// TODO: Replace with your real Google OAuth Client ID for Expo Go or standalone app
const GOOGLE_CLIENT_ID = '427630115371-0plfn5i8a64vrro6mpggvsckerljc9cg.apps.googleusercontent.com';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [messageId, setMessageId] = useState('');
  
  const [decryptId, setDecryptId] = useState('');
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');

  // Google Auth Session
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    responseType: ResponseType.IdToken,
    scopes: ['profile', 'email'],
    redirectUri: makeRedirectUri({ useProxy: true }),
  });

  useEffect(() => {
    if (authToken) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleSignup = async () => {
    const { name, email, password, confirmPassword } = signupData;
    
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAuthToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);
        setCurrentPage('home');
        Alert.alert('Success', 'Account created successfully!');
        setSignupData({ name: '', email: '', password: '', confirmPassword: '' });
      } else {
        Alert.alert('Error', data.error || 'Signup failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  const handleLogin = async () => {
    const { email, password } = loginData;
    
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAuthToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);
        setCurrentPage('home');
        Alert.alert('Success', 'Logged in successfully!');
        setLoginData({ email: '', password: '' });
      } else {
        Alert.alert('Error', data.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await promptAsync();
      if (result.type === 'success' && result.authentication) {
        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${result.authentication.accessToken}` },
        });
        const userInfo = await userInfoResponse.json();
        // Send to backend
        const response = await fetch(`${API_URL}/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            googleToken: result.authentication.accessToken,
            userInfo
          }),
        });
        const data = await response.json();
        if (response.ok) {
          setAuthToken(data.token);
          setUser(data.user);
          setIsLoggedIn(true);
          setCurrentPage('home');
          Alert.alert('Success', `Welcome ${userInfo.name || userInfo.email}! Google login successful!`);
        } else {
          Alert.alert('Error', data.error || 'Google login failed');
        }
      } else if (result.type === 'error') {
        Alert.alert('Error', 'Google sign-in failed. Please try again.');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      // Create user info object from Apple credential
      const userInfo = {
        name: credential.fullName?.givenName && credential.fullName?.familyName 
          ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
          : 'Apple User',
        email: credential.email || `appleuser${Date.now()}@example.com`,
        appleId: credential.user,
      };

      // Send to backend (using the same endpoint as Google for now)
      const response = await fetch(`${API_URL}/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          googleToken: credential.identityToken,
          userInfo
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAuthToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);
        setCurrentPage('home');
        Alert.alert('Success', `Welcome ${userInfo.name}! Apple login successful!`);
      } else {
        Alert.alert('Error', data.error || 'Apple login failed');
      }
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        // User cancelled the sign-in
        return;
      }
      console.error('Apple sign-in error:', error);
      Alert.alert('Error', 'Apple sign-in failed. Please try again.');
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setIsLoggedIn(false);
    setCurrentPage('home');
    clearForm();
    Alert.alert('Success', 'Logged out successfully');
  };

  const handleEncrypt = async () => {
    if (!isLoggedIn) {
      Alert.alert('Authentication Required', 'Please log in to encrypt messages.');
      return;
    }
    
    if (!message || !password) {
      Alert.alert('Error', 'Please enter both message and password.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/encrypt`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ message, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessageId(data.id);
        Alert.alert('Success', `Message encrypted! ID: ${data.id}`);
      } else {
        Alert.alert('Error', data.error || 'Encryption failed.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server.');
    }
  };

  const handleDecrypt = async () => {
    if (!isLoggedIn) {
      Alert.alert('Authentication Required', 'Please log in to decrypt messages.');
      return;
    }
    
    if (!decryptId || !decryptPassword) {
      Alert.alert('Error', 'Please enter both message ID and password.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/decrypt`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ id: decryptId, password: decryptPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setDecryptedMessage(data.message);
      } else {
        setDecryptedMessage('');
        Alert.alert('Error', data.error || 'Decryption failed.');
      }
    } catch (e) {
      setDecryptedMessage('');
      Alert.alert('Error', 'Could not connect to server.');
    }
  };

  const clearForm = () => {
    setMessage('');
    setPassword('');
    setMessageId('');
    setDecryptId('');
    setDecryptPassword('');
    setDecryptedMessage('');
  };

  // Clipboard handlers
  const handleCopyMessageId = async () => {
    if (messageId) {
      await Clipboard.setStringAsync(messageId);
      Alert.alert('Copied', 'Message ID copied to clipboard!');
    }
  };

  const handlePasteDecryptId = async () => {
    const clipboardContent = await Clipboard.getStringAsync();
    setDecryptId(clipboardContent);
  };

  const renderLoginPage = () => (
    <View style={styles.loginSignupBg}>
      {/* Top abstract SVG background */}
      <Svg height="120" width="100%" style={styles.loginSignupSvgTop}>
        <Ellipse cx="60%" cy="60" rx="180" ry="60" fill="#eaf6fb" opacity="0.7" />
        <Ellipse cx="30%" cy="40" rx="90" ry="30" fill="#3498db" opacity="0.12" />
      </Svg>
      <ScrollView contentContainerStyle={styles.loginSignupScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.loginSignupContent}>
          <TouchableOpacity style={styles.loginSignupHomeBtn} onPress={() => setCurrentPage('home')}>
            <MaterialIcons name="arrow-back" size={24} color="#3498db" />
            <Text style={styles.loginSignupHomeBtnText}>Home</Text>
          </TouchableOpacity>
          <View style={styles.loginSignupIconCircle}>
            <Text style={styles.loginSignupIconLarge}>🔒</Text>
          </View>
          <Text style={styles.loginSignupTitle}>Welcome Back</Text>
          <Text style={styles.loginSignupTagline}>End-to-end encrypted. Private. Secure.</Text>
          <Text style={styles.loginSignupSubtitle}>Log in to access your secure messages and friends.</Text>
          <View style={styles.loginSignupFormCardDecorated}>
            <View style={styles.inputIconRow}>
              <MaterialIcons name="email" size={22} color="#b2bec3" style={styles.inputIcon} />
              <TextInput
                style={[styles.inputModern, loginData.email && styles.inputModernFilled]}
                placeholder="Email"
                value={loginData.email}
                onChangeText={(text) => setLoginData({...loginData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                textContentType="emailAddress"
                accessibilityLabel="Login email"
                placeholderTextColor="#b2bec3"
              />
            </View>
            <View style={styles.inputIconRow}>
              <MaterialIcons name="lock" size={22} color="#b2bec3" style={styles.inputIcon} />
              <TextInput
                style={[styles.inputModern, loginData.password && styles.inputModernFilled]}
                placeholder="Password"
                value={loginData.password}
                onChangeText={(text) => setLoginData({...loginData, password: text})}
                secureTextEntry
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="none"
                textContentType="password"
                accessibilityLabel="Login password"
                placeholderTextColor="#b2bec3"
              />
            </View>
            <TouchableOpacity style={styles.primaryButtonAccent} onPress={handleLogin} activeOpacity={0.85}>
              <Text style={styles.primaryButtonTextAccent}>Log In</Text>
            </TouchableOpacity>
            <View style={styles.divider}>
              <Text style={styles.dividerText}>OR</Text>
            </View>
            {Platform.OS === 'ios'
              ? (Constants.appOwnership === 'expo'
                  ? <Text style={{ color: '#7f8c8d', textAlign: 'center', marginVertical: 10, fontWeight: '600' }}>
                       Apple Sign In is only available in the standalone app.
                    </Text>
                  : <TouchableOpacity style={styles.appleButtonAccent} onPress={handleAppleSignIn} activeOpacity={0.85}>
                      <Text style={styles.appleButtonTextAccent}>
                        <Text style={{ fontSize: 18, fontWeight: '900', marginRight: 6 }}></Text> Continue with Apple
                      </Text>
                    </TouchableOpacity>
                )
              : <Text style={{ color: '#7f8c8d', textAlign: 'center', marginVertical: 10, fontWeight: '600' }}>Test Login Button</Text>
            }
          </View>
          <TouchableOpacity onPress={() => setCurrentPage('signup')} style={styles.loginSignupSwitchLink}>
            <Text style={styles.loginSignupSwitchText}>Don't have an account? <Text style={{color:'#3498db', fontWeight:'bold'}}>Sign Up</Text></Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loginSignupFooter}>
          <Text style={styles.loginSignupFooterText}>Powered by CipherPoint • v1.0</Text>
        </View>
      </ScrollView>
      {/* Bottom abstract SVG background */}
      <Svg height="100" width="100%" style={styles.loginSignupSvgBottom}>
        <Ellipse cx="40%" cy="60" rx="120" ry="40" fill="#27ae60" opacity="0.10" />
        <Ellipse cx="80%" cy="40" rx="60" ry="20" fill="#3498db" opacity="0.10" />
      </Svg>
    </View>
  );

  const renderSignupPage = () => (
    <View style={styles.loginSignupBg}>
      {/* Top abstract SVG background */}
      <Svg height="120" width="100%" style={styles.loginSignupSvgTop}>
        <Ellipse cx="60%" cy="60" rx="180" ry="60" fill="#eaf6fb" opacity="0.7" />
        <Ellipse cx="30%" cy="40" rx="90" ry="30" fill="#3498db" opacity="0.12" />
      </Svg>
      <ScrollView contentContainerStyle={styles.loginSignupScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.loginSignupContent}>
          <TouchableOpacity style={styles.loginSignupHomeBtn} onPress={() => setCurrentPage('home')}>
            <MaterialIcons name="arrow-back" size={24} color="#3498db" />
            <Text style={styles.loginSignupHomeBtnText}>Home</Text>
          </TouchableOpacity>
          <View style={styles.loginSignupIconCircle}>
            <Text style={styles.loginSignupIconLarge}>🔒</Text>
          </View>
          <Text style={styles.loginSignupTitle}>Create Account</Text>
          <Text style={styles.loginSignupTagline}>End-to-end encrypted. Private. Secure.</Text>
          <Text style={styles.loginSignupSubtitle}>Sign up to start encrypting and sharing secure messages.</Text>
          <View style={styles.loginSignupFormCardDecorated}>
            <View style={styles.inputIconRow}>
              <MaterialIcons name="person" size={22} color="#b2bec3" style={styles.inputIcon} />
              <TextInput
                style={[styles.inputModern, signupData.name && styles.inputModernFilled]}
                placeholder="Full Name"
                value={signupData.name}
                onChangeText={(text) => setSignupData({...signupData, name: text})}
                autoComplete="name"
                autoCorrect={false}
                textContentType="name"
                accessibilityLabel="Full name"
                placeholderTextColor="#b2bec3"
              />
            </View>
            <View style={styles.inputIconRow}>
              <MaterialIcons name="email" size={22} color="#b2bec3" style={styles.inputIcon} />
              <TextInput
                style={[styles.inputModern, signupData.email && styles.inputModernFilled]}
                placeholder="Email"
                value={signupData.email}
                onChangeText={(text) => setSignupData({...signupData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                textContentType="emailAddress"
                accessibilityLabel="Signup email"
                placeholderTextColor="#b2bec3"
              />
            </View>
            <View style={styles.inputIconRow}>
              <MaterialIcons name="lock" size={22} color="#b2bec3" style={styles.inputIcon} />
              <TextInput
                style={[styles.inputModern, signupData.password && styles.inputModernFilled]}
                placeholder="Password (min 6 chars)"
                value={signupData.password}
                onChangeText={(text) => setSignupData({...signupData, password: text})}
                secureTextEntry
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="none"
                textContentType="newPassword"
                accessibilityLabel="Signup password"
                placeholderTextColor="#b2bec3"
              />
            </View>
            <View style={styles.inputIconRow}>
              <MaterialIcons name="lock" size={22} color="#b2bec3" style={styles.inputIcon} />
              <TextInput
                style={[styles.inputModern, signupData.confirmPassword && styles.inputModernFilled]}
                placeholder="Confirm Password"
                value={signupData.confirmPassword}
                onChangeText={(text) => setSignupData({...signupData, confirmPassword: text})}
                secureTextEntry
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="none"
                textContentType="newPassword"
                accessibilityLabel="Confirm signup password"
                placeholderTextColor="#b2bec3"
              />
            </View>
            <TouchableOpacity style={styles.primaryButtonAccent} onPress={handleSignup} activeOpacity={0.85}>
              <Text style={styles.primaryButtonTextAccent}>Create Account</Text>
            </TouchableOpacity>
            <View style={styles.divider}>
              <Text style={styles.dividerText}>OR</Text>
            </View>
            {Platform.OS === 'ios'
              ? (Constants.appOwnership === 'expo'
                  ? <Text style={{ color: '#7f8c8d', textAlign: 'center', marginVertical: 10, fontWeight: '600' }}>
                       Apple Sign In is only available in the standalone app.
                    </Text>
                  : <TouchableOpacity style={styles.appleButtonAccent} onPress={handleAppleSignIn} activeOpacity={0.85}>
                      <Text style={styles.appleButtonTextAccent}>
                        <Text style={{ fontSize: 18, fontWeight: '900', marginRight: 6 }}></Text> Continue with Apple
                      </Text>
                    </TouchableOpacity>
                )
              : <Text style={{ color: '#7f8c8d', textAlign: 'center', marginVertical: 10, fontWeight: '600' }}>Test Login Button</Text>
            }
          </View>
          <TouchableOpacity onPress={() => setCurrentPage('login')} style={styles.loginSignupSwitchLink}>
            <Text style={styles.loginSignupSwitchText}>Already have an account? <Text style={{color:'#3498db', fontWeight:'bold'}}>Log In</Text></Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loginSignupFooter}>
          <Text style={styles.loginSignupFooterText}>Powered by CipherPoint • v1.0</Text>
        </View>
      </ScrollView>
      {/* Bottom abstract SVG background */}
      <Svg height="100" width="100%" style={styles.loginSignupSvgBottom}>
        <Ellipse cx="40%" cy="60" rx="120" ry="40" fill="#27ae60" opacity="0.10" />
        <Ellipse cx="80%" cy="40" rx="60" ry="20" fill="#3498db" opacity="0.10" />
      </Svg>
    </View>
  );

  const renderEncryptPage = () => (
    <View style={styles.bgContainer}>
      {/* Top abstract SVG background */}
      <Svg height="120" width="100%" style={styles.svgTop}>
        <Ellipse cx="60%" cy="60" rx="180" ry="60" fill="#eaf6fb" opacity="0.7" />
        <Ellipse cx="30%" cy="40" rx="90" ry="30" fill="#3498db" opacity="0.12" />
      </Svg>
      <ScrollView contentContainerStyle={styles.containerClean}>
        <View style={styles.headerClean}>
          <TouchableOpacity onPress={() => setCurrentPage('home')}>
            <Text style={styles.backButtonClean}>← Home</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitleClean}>Encrypt Message</Text>
          <Text style={styles.infoTextClean}>Type your message and a password. Only those with the password can decrypt it. Share the message ID with your recipient.</Text>
        </View>
        <View style={styles.formCardClean}>
          <Text style={styles.sectionHeaderClean}>Encrypt a new message</Text>
          <TextInput
            style={[styles.inputBoxDecorated, { minHeight: 80 }]}
            placeholder="Enter your message"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            placeholderTextColor="#b2bec3"
          />
          <TextInput
            style={styles.inputBoxDecorated}
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            textContentType="none"
            accessibilityLabel="Message encryption password"
            placeholderTextColor="#b2bec3"
          />
          <TouchableOpacity style={styles.primaryButtonAccent} onPress={handleEncrypt}>
            <Text style={styles.primaryButtonTextAccent}>Encrypt Message</Text>
          </TouchableOpacity>
          {messageId ? (
            <View style={styles.resultCardClean}>
              <Text style={styles.resultTitleClean}>Message Encrypted!</Text>
              <View style={styles.inputWithButtonRowClean}>
                <Text style={[styles.resultTextClean, { flex: 1 }]} numberOfLines={1} ellipsizeMode="middle">Message ID: {messageId}</Text>
                <TouchableOpacity style={styles.pasteButtonClean} onPress={handleCopyMessageId}>
                  <Text style={styles.pasteButtonTextClean}>Copy</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.resultNoteClean}>Share this ID with the recipient</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      {/* Bottom abstract SVG background */}
      <Svg height="100" width="100%" style={styles.svgBottom}>
        <Ellipse cx="40%" cy="60" rx="120" ry="40" fill="#27ae60" opacity="0.10" />
        <Ellipse cx="80%" cy="40" rx="60" ry="20" fill="#3498db" opacity="0.10" />
      </Svg>
    </View>
  );

  const renderDecryptPage = () => (
    <View style={styles.bgContainer}>
      {/* Top abstract SVG background */}
      <Svg height="120" width="100%" style={styles.svgTop}>
        <Ellipse cx="60%" cy="60" rx="180" ry="60" fill="#eaf6fb" opacity="0.7" />
        <Ellipse cx="30%" cy="40" rx="90" ry="30" fill="#3498db" opacity="0.12" />
      </Svg>
      <ScrollView contentContainerStyle={styles.containerClean}>
        <View style={styles.headerClean}>
          <TouchableOpacity onPress={() => setCurrentPage('home')}>
            <Text style={styles.backButtonClean}>← Home</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitleClean}>Decrypt Message</Text>
          <Text style={styles.infoTextClean}>Enter the message ID and password to decrypt a message. Only the correct password will reveal the message.</Text>
        </View>
        <View style={styles.formCardClean}>
          <Text style={styles.sectionHeaderClean}>Decrypt a message</Text>
          <View style={styles.inputWithButtonRowCleanFixed}>
            <TextInput
              style={[styles.inputBoxDecorated, styles.inputWithButtonFlex]}
              placeholder="Enter message ID"
              value={decryptId}
              onChangeText={setDecryptId}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#b2bec3"
            />
            <TouchableOpacity style={styles.pasteButtonCleanFixed} onPress={handlePasteDecryptId}>
              <Text style={styles.pasteButtonTextClean}>Paste</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.inputBoxDecorated}
            placeholder="Enter password"
            value={decryptPassword}
            onChangeText={setDecryptPassword}
            secureTextEntry
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            textContentType="none"
            accessibilityLabel="Message decryption password"
            placeholderTextColor="#b2bec3"
          />
          <TouchableOpacity style={styles.primaryButtonAccent} onPress={handleDecrypt}>
            <Text style={styles.primaryButtonTextAccent}>Decrypt Message</Text>
          </TouchableOpacity>
          {decryptedMessage ? (
            <View style={styles.resultCardClean}>
              <Text style={styles.resultTitleClean}>Message Decrypted!</Text>
              <Text style={styles.resultTextClean}>{decryptedMessage}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      {/* Bottom abstract SVG background */}
      <Svg height="100" width="100%" style={styles.svgBottom}>
        <Ellipse cx="40%" cy="60" rx="120" ry="40" fill="#27ae60" opacity="0.10" />
        <Ellipse cx="80%" cy="40" rx="60" ry="20" fill="#3498db" opacity="0.10" />
      </Svg>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      {currentPage === 'home' && (
        <HomeScreen 
          onNavigate={setCurrentPage} 
          isLoggedIn={isLoggedIn}
          onLogin={() => setCurrentPage('login')}
          onSignup={() => setCurrentPage('signup')}
          onLogout={handleLogout}
          user={user}
        />
      )}
      {currentPage === 'login' && renderLoginPage()}
      {currentPage === 'signup' && renderSignupPage()}
      {currentPage === 'encrypt' && renderEncryptPage()}
      {currentPage === 'decrypt' && renderDecryptPage()}
      {currentPage === 'messaging' && (
        <View style={styles.bgContainer}>
          <Svg height="120" width="100%" style={styles.svgTop} pointerEvents="none">
            <Ellipse cx="60%" cy="60" rx="180" ry="60" fill="#eaf6fb" opacity="0.7" />
            <Ellipse cx="30%" cy="40" rx="90" ry="30" fill="#3498db" opacity="0.12" />
          </Svg>
          <View style={styles.messagingCardDecorated}>
            <MessagingScreen 
              authToken={authToken}
              user={user}
              onNavigate={setCurrentPage}
            />
          </View>
          <View style={styles.messagingFooterClean}>
            <Text style={styles.messagingFooterTextClean}>Powered by CipherPoint • v1.0</Text>
          </View>
          <Svg height="100" width="100%" style={styles.svgBottom} pointerEvents="none">
            <Ellipse cx="40%" cy="60" rx="120" ry="40" fill="#27ae60" opacity="0.10" />
            <Ellipse cx="80%" cy="40" rx="60" ry="20" fill="#3498db" opacity="0.10" />
          </Svg>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#3498db',
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  formCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  primaryButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#d5f4e6',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 5,
  },
  resultNote: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  idContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  copyButton: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 4,
    marginLeft: 10,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  copyButtonClean: {
    backgroundColor: '#f5fafd',
    borderWidth: 1,
    borderColor: '#3498db',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  copyButtonTextClean: {
    color: '#3498db',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inputWithButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputWithButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
    marginRight: 0,
  },
  pasteButtonClean: {
    backgroundColor: '#f5fafd',
    borderWidth: 1,
    borderColor: '#27ae60',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  pasteButtonTextClean: {
    color: '#27ae60',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  divider: {
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerText: {
    flex: 1,
    textAlign: 'center',
    color: '#7f8c8d',
  },
  googleButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  loginSignupBg: {
    flex: 1,
    backgroundColor: '#f5fafd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginSignupSvgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  loginSignupSvgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  loginSignupScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
    width: '100%',
  },
  loginSignupContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
    zIndex: 1,
  },
  loginSignupIconLarge: {
    fontSize: 54,
    color: '#3498db',
    marginBottom: 10,
    marginTop: 10,
  },
  loginSignupIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#eaf6fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  loginSignupTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
    textAlign: 'center',
  },
  loginSignupTagline: {
    fontSize: 14,
    color: '#27ae60',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  loginSignupSubtitle: {
    fontSize: 15,
    color: '#7f8c8d',
    marginBottom: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  loginSignupFormCardDecorated: {
    backgroundColor: 'white',
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#eaf6fb',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
    width: '100%',
    marginBottom: 18,
    alignItems: 'center',
  },
  primaryButtonAccent: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
    width: '100%',
    minWidth: 160,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'center',
  },
  primaryButtonTextAccent: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
    flexShrink: 1,
  },
  googleButtonAccent: {
    backgroundColor: '#3498db',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    minWidth: 160,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'center',
  },
  googleButtonTextAccent: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  appleButtonAccent: {
    backgroundColor: '#000',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'center',
  },
  appleButtonTextAccent: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  loginSignupFeaturesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 18,
    marginTop: 10,
    marginBottom: 18,
    width: '100%',
    zIndex: 1,
  },
  loginSignupFeature: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  loginSignupFeatureIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  loginSignupFeatureText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  loginSignupFooter: {
    marginTop: 10,
    marginBottom: 8,
    alignItems: 'center',
    width: '100%',
  },
  loginSignupFooterText: {
    fontSize: 12,
    color: '#b2bec3',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  loginSignupSwitchLink: {
    marginTop: 10,
  },
  loginSignupSwitchText: {
    color: '#7f8c8d',
    fontSize: 14,
    textAlign: 'center',
  },
  loginSignupHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginLeft: 2,
    backgroundColor: 'rgba(52,152,219,0.07)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  loginSignupHomeBtnText: {
    color: '#3498db',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 2,
  },
  inputIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
    backgroundColor: '#fafdff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#eaf6fb',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  inputIcon: {
    marginRight: 6,
  },
  inputModern: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 10,
    paddingHorizontal: 2,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 10,
  },
  inputModernFilled: {
    color: '#2c3e50',
    fontWeight: '600',
  },
  primaryButtonModern: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 8,
    elevation: 2,
  },
  primaryButtonModernGradient: {
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonModernText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  googleButtonModern: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 2,
    elevation: 1,
  },
  googleButtonModernGradient: {
    borderRadius: 30,
    paddingVertical: 13,
    alignItems: 'center',
    width: '100%',
  },
  googleButtonModernText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  containerClean: {
    flexGrow: 1,
    backgroundColor: '#f5fafd',
    padding: 24,
    minHeight: '100%',
  },
  headerClean: {
    marginTop: 60,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  backButtonClean: {
    fontSize: 16,
    color: '#3498db',
    marginBottom: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(52,152,219,0.07)',
  },
  pageTitleClean: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
    marginTop: 2,
  },
  infoTextClean: {
    fontSize: 15,
    color: '#7f8c8d',
    marginBottom: 10,
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 21,
  },
  formCardClean: {
    backgroundColor: 'white',
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderRadius: 18,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 5,
    width: '100%',
    marginBottom: 18,
    alignItems: 'stretch',
  },
  sectionHeaderClean: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 16,
    textAlign: 'left',
  },
  inputWithButtonRowClean: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  resultCardClean: {
    backgroundColor: '#d5f4e6',
    padding: 18,
    borderRadius: 12,
    marginTop: 24,
    borderLeftWidth: 5,
    borderLeftColor: '#27ae60',
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  resultTitleClean: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8,
  },
  resultTextClean: {
    fontSize: 15,
    color: '#2c3e50',
    marginBottom: 5,
    fontWeight: '500',
  },
  resultNoteClean: {
    fontSize: 13,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 2,
  },
  inputBoxDecorated: {
    borderColor: '#eaf6fb',
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: '#fafdff',
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 15,
    height: 40,
  },
  inputWithButtonRowCleanFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
    gap: 8,
  },
  inputWithButtonFlex: {
    flex: 1,
    minWidth: 0,
  },
  pasteButtonCleanFixed: {
    backgroundColor: '#f5fafd',
    borderWidth: 1,
    borderColor: '#27ae60',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginTop: -15,
  },
  pasteButtonTextClean: {
    color: '#27ae60',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bgContainer: {
    flex: 1,
    backgroundColor: '#f5fafd',
  },
  svgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  svgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  messagingCardDecorated: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    marginVertical: 12,
    marginHorizontal: 10,
    width: 'auto',
    flex: 1,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 400,
    maxWidth: 700,
    alignSelf: 'center',
  },
  messagingFooterClean: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
  },
  messagingFooterTextClean: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
});
