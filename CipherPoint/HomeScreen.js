import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

const HomeScreen = ({ onNavigate, isLoggedIn, onLogin, onSignup, onLogout, user }) => {
  return (
    <View style={styles.container}>
      {/* Logo and Title Section */}
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🔐</Text>
        </View>
        <Text style={styles.title}>CipherPoint</Text>
        <Text style={styles.subtitle}>Secure Message Encryption</Text>
        
        {/* User Info */}
        {isLoggedIn && user && (
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Welcome back, {user.name}!</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        )}
      </View>

      {/* Main Action Buttons */}
      <View style={styles.actionSection}>
        {isLoggedIn ? (
          <>
            <TouchableOpacity 
              style={styles.mainButton} 
              onPress={() => onNavigate('encrypt')}
            >
              <Text style={styles.mainButtonIcon}>🔒</Text>
              <Text style={styles.mainButtonText}>Encrypt Message</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.mainButton} 
              onPress={() => onNavigate('decrypt')}
            >
              <Text style={styles.mainButtonIcon}>🔓</Text>
              <Text style={styles.mainButtonText}>Decrypt Message</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.authPromptContainer}>
            <Text style={styles.authPromptTitle}>Welcome to CipherPoint!</Text>
            <Text style={styles.authPromptText}>
              Create an account or sign in to start encrypting and decrypting messages securely.
            </Text>
            <View style={styles.authPromptButtons}>
              <TouchableOpacity style={styles.authPromptButton} onPress={onSignup}>
                <Text style={styles.authPromptButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Login/Signup Section */}
      <View style={styles.authSection}>
        {isLoggedIn ? (
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.authButton} onPress={onLogin}>
              <Text style={styles.authButtonText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.authButton, styles.signupButton]} onPress={onSignup}>
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  headerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    fontSize: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  userInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  actionSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  mainButton: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mainButtonIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  authPromptContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  authPromptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  authPromptText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  authPromptButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  authPromptButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authPromptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  authSection: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 40,
  },
  authButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3498db',
    alignItems: 'center',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
  },
  signupButton: {
    backgroundColor: '#3498db',
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  logoutButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default HomeScreen; 