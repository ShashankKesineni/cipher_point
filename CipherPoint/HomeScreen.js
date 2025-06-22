import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Svg, Ellipse } from 'react-native-svg';

const HomeScreen = ({ onNavigate, isLoggedIn, onLogin, onSignup, onLogout, user }) => {
  return (
    <View style={styles.bgContainer}>
      {/* Top abstract SVG background (always behind content) */}
      <Svg height="120" width="100%" style={[styles.svgTop, { zIndex: 0 }] } pointerEvents="none">
        <Ellipse cx="60%" cy="60" rx="180" ry="60" fill="#eaf6fb" opacity="0.7" />
        <Ellipse cx="30%" cy="40" rx="90" ry="30" fill="#3498db" opacity="0.12" />
      </Svg>
      {/* Log Out button (top right) */}
      {isLoggedIn && (
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.85}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      )}
      <ScrollView contentContainerStyle={styles.scrollClean}>
        <View style={styles.centerContentClean}>
          <View style={styles.logoContainerClean}>
            <Text style={styles.logoClean}>🔐</Text>
          </View>
          <Text style={styles.titleClean}>CipherPoint</Text>
          <Text style={styles.subtitleClean}>Secure, Encrypted Messaging & Location Sharing</Text>
          <View style={styles.mainCardDecorated}>
            {isLoggedIn && user && (
              <View style={styles.userInfoClean}>
                <Text style={styles.welcomeTextClean}>Welcome, {user.name}!</Text>
                <Text style={styles.userEmailClean}>{user.email}</Text>
              </View>
            )}
            <View style={styles.onboardingCardClean}>
              <Text style={styles.onboardingTitleClean}>How CipherPoint Works</Text>
              <View style={styles.onboardingStepRowClean}><Text style={styles.onboardingStepNumClean}>1.</Text><Text style={styles.onboardingStepClean}><Text style={styles.boldClean}>Encrypt</Text> your message with a password.</Text></View>
              <View style={styles.onboardingStepRowClean}><Text style={styles.onboardingStepNumClean}>2.</Text><Text style={styles.onboardingStepClean}><Text style={styles.boldClean}>Share</Text> the message ID with your recipient.</Text></View>
              <View style={styles.onboardingStepRowClean}><Text style={styles.onboardingStepNumClean}>3.</Text><Text style={styles.onboardingStepClean}><Text style={styles.boldClean}>Decrypt</Text> using the ID and password.</Text></View>
              <View style={styles.onboardingStepRowClean}><Text style={styles.onboardingStepNumClean}>4.</Text><Text style={styles.onboardingStepClean}><Text style={styles.boldClean}>Location-based</Text> messages require being at a specific place to unlock.</Text></View>
            </View>
            <View style={styles.actionSectionClean}>
              {isLoggedIn ? (
                <>
                  <TouchableOpacity 
                    style={[styles.mainButtonClean, styles.encryptButtonClean]} 
                    onPress={() => onNavigate('encrypt')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.mainButtonIconClean}>🔒</Text>
                    <Text style={styles.mainButtonTextClean}>Encrypt Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.mainButtonClean, styles.decryptButtonClean]} 
                    onPress={() => onNavigate('decrypt')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.mainButtonIconClean}>🔓</Text>
                    <Text style={styles.mainButtonTextClean}>Decrypt Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.mainButtonClean, styles.messagingButtonClean]} 
                    onPress={() => onNavigate('messaging')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.mainButtonIconClean}>💬</Text>
                    <Text style={styles.mainButtonTextClean}>Messaging</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.authPromptContainerClean}>
                  <Text style={styles.authPromptTitleClean}>Welcome to CipherPoint!</Text>
                  <Text style={styles.authPromptTextClean}>
                    Create an account or sign in to start encrypting and decrypting messages securely.
                  </Text>
                  <View style={styles.authPromptButtonsClean}>
                    <TouchableOpacity style={styles.authPromptButtonClean} onPress={onSignup} activeOpacity={0.85}>
                      <Text style={styles.authPromptButtonTextClean}>Get Started</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
          <View style={styles.footerClean}>
            <Text style={styles.footerTextClean}>Powered by CipherPoint • v1.0</Text>
          </View>
          {/* Login/Signup Section */}
          {!isLoggedIn && (
            <View style={styles.authSectionClean}>
              <TouchableOpacity style={styles.authButtonClean} onPress={onLogin} activeOpacity={0.85}>
                <Text style={styles.authButtonTextClean}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.authButtonClean, styles.signupButtonClean]} onPress={onSignup} activeOpacity={0.85}>
                <Text style={styles.signupButtonTextClean}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Bottom abstract SVG background (always behind content) */}
      <Svg height="100" width="100%" style={[styles.svgBottom, { zIndex: 0 }]} pointerEvents="none">
        <Ellipse cx="40%" cy="60" rx="120" ry="40" fill="#27ae60" opacity="0.10" />
        <Ellipse cx="80%" cy="40" rx="60" ry="20" fill="#3498db" opacity="0.10" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  bgContainer: {
    flexGrow: 1,
    backgroundColor: '#f5fafd',
    padding: 20,
    minHeight: '100%',
  },
  svgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scrollClean: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  centerContentClean: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: 600,
    paddingTop: 50,
  },
  logoContainerClean: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  logoClean: {
    fontSize: 54,
  },
  titleClean: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitleClean: {
    fontSize: 16,
    color: '#27ae60',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  mainCardDecorated: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginVertical: 12,
    width: '100%',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfoClean: {
    backgroundColor: '#eaf6fb',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeTextClean: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  userEmailClean: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  onboardingCardClean: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginVertical: 12,
    width: '100%',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  onboardingTitleClean: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 8,
    textAlign: 'center',
  },
  onboardingStepRowClean: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  onboardingStepNumClean: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginRight: 5,
  },
  onboardingStepClean: {
    fontSize: 15,
    color: '#2c3e50',
  },
  boldClean: {
    fontWeight: 'bold',
    color: '#27ae60',
  },
  actionSectionClean: {
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
    gap: 18,
  },
  mainButtonClean: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  mainButtonIconClean: {
    fontSize: 24,
    marginRight: 15,
  },
  mainButtonTextClean: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  encryptButtonClean: {
    borderLeftWidth: 6,
    borderLeftColor: '#27ae60',
  },
  decryptButtonClean: {
    borderLeftWidth: 6,
    borderLeftColor: '#3498db',
  },
  messagingButtonClean: {
    borderLeftWidth: 6,
    borderLeftColor: '#f1c40f',
  },
  authPromptContainerClean: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  authPromptTitleClean: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  authPromptTextClean: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  authPromptButtonsClean: {
    flexDirection: 'row',
    gap: 10,
  },
  authPromptButtonClean: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authPromptButtonTextClean: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerClean: {
    marginTop: 18,
    marginBottom: 8,
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
  },
  footerTextClean: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  svgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  authSectionClean: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    justifyContent: 'center',
  },
  authButtonClean: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3498db',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  authButtonTextClean: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
  },
  signupButtonClean: {
    backgroundColor: '#3498db',
  },
  signupButtonTextClean: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  logoutButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default HomeScreen;
