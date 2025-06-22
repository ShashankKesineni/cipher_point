import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ScrollView, TouchableOpacity } from 'react-native';
import HomeScreen from './HomeScreen';
import MessagingScreen from './MessagingScreen';

const API_URL = 'https://cipherpoint-production.up.railway.app';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  
  // Form states
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  // Encrypt state
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [messageId, setMessageId] = useState('');
  
  // Decrypt state
  const [decryptId, setDecryptId] = useState('');
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');

  // Check for existing token on app start
  useEffect(() => {
    // In a real app, you'd check AsyncStorage for saved tokens
    // For now, we'll just check if we have a token in state
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
      // For now, we'll create a mock Google user without actual OAuth
      // In production, you'd implement proper Google OAuth flow
      const mockGoogleUser = {
        name: 'Google User',
        email: `googleuser${Date.now()}@example.com`,
        googleId: `google_${Date.now()}`
      };

      const response = await fetch(`${API_URL}/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          googleToken: 'mock_token',
          userInfo: mockGoogleUser 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAuthToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);
        setCurrentPage('home');
        Alert.alert('Success', `Welcome ${mockGoogleUser.name}! Google login successful!`);
      } else {
        Alert.alert('Error', data.error || 'Google login failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
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

  const renderLoginPage = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage('home')}>
          <Text style={styles.backButton}>← Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Log In</Text>
      </View>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={loginData.email}
          onChangeText={(text) => setLoginData({...loginData, email: text})}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          textContentType="emailAddress"
          accessibilityLabel="Login email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={loginData.password}
          onChangeText={(text) => setLoginData({...loginData, password: text})}
          secureTextEntry
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="none"
          textContentType="password"
          accessibilityLabel="Login password"
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>Log In</Text>
        </TouchableOpacity>
        
        <View style={styles.divider}>
          <Text style={styles.dividerText}>OR</Text>
        </View>
        
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Text style={styles.googleButtonText}>🔍 Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSignupPage = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage('home')}>
          <Text style={styles.backButton}>← Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Sign Up</Text>
      </View>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={signupData.name}
          onChangeText={(text) => setSignupData({...signupData, name: text})}
          autoComplete="name"
          autoCorrect={false}
          textContentType="name"
          accessibilityLabel="Full name"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={signupData.email}
          onChangeText={(text) => setSignupData({...signupData, email: text})}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          textContentType="emailAddress"
          accessibilityLabel="Signup email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={signupData.password}
          onChangeText={(text) => setSignupData({...signupData, password: text})}
          secureTextEntry
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="none"
          textContentType="newPassword"
          accessibilityLabel="Signup password"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={signupData.confirmPassword}
          onChangeText={(text) => setSignupData({...signupData, confirmPassword: text})}
          secureTextEntry
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="none"
          textContentType="newPassword"
          accessibilityLabel="Confirm signup password"
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>
        
        <View style={styles.divider}>
          <Text style={styles.dividerText}>OR</Text>
        </View>
        
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Text style={styles.googleButtonText}>🔍 Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderEncryptPage = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage('home')}>
          <Text style={styles.backButton}>← Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Encrypt Message</Text>
      </View>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder="Enter your message"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="none"
          textContentType="none"
          accessibilityLabel="Message encryption password"
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleEncrypt}>
          <Text style={styles.primaryButtonText}>Encrypt Message</Text>
        </TouchableOpacity>
        
        {messageId ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Message Encrypted Successfully!</Text>
            <View style={styles.idContainer}>
              <Text style={styles.resultText}>Message ID: {messageId}</Text>
            </View>
            <Text style={styles.resultNote}>Share this ID with the recipient</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );

  const renderDecryptPage = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage('home')}>
          <Text style={styles.backButton}>← Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Decrypt Message</Text>
      </View>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder="Enter message ID"
          value={decryptId}
          onChangeText={setDecryptId}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          value={decryptPassword}
          onChangeText={setDecryptPassword}
          secureTextEntry
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="none"
          textContentType="none"
          accessibilityLabel="Message decryption password"
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleDecrypt}>
          <Text style={styles.primaryButtonText}>Decrypt Message</Text>
        </TouchableOpacity>
        
        {decryptedMessage ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Message Decrypted!</Text>
            <Text style={styles.resultText}>{decryptedMessage}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
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
        <MessagingScreen 
          authToken={authToken}
          user={user}
          onNavigate={setCurrentPage}
        />
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
});
