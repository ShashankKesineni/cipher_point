import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  FlatList,
  Modal,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import MapView, { Marker, Circle } from 'react-native-maps';

const API_URL = 'https://cipherpoint-production.up.railway.app';
const { width, height } = Dimensions.get('window');

const MessagingScreen = ({ authToken, user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagePassword, setMessagePassword] = useState('');
  const [decryptedMessages, setDecryptedMessages] = useState({});
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [passwordInputs, setPasswordInputs] = useState({});
  const [decryptingMessages, setDecryptingMessages] = useState({});
  const [location, setLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const messagesListRef = useRef(null);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Info texts for each tab
  const tabInfo = {
    friends: 'View and manage your friends. Start a secure conversation with anyone you trust.',
    search: 'Search for users by name or email. Add them as friends to start messaging securely.',
    conversations: 'View your encrypted conversations. Messages may require a password or location to decrypt.'
  };

  useEffect(() => {
    if (authToken) {
      loadFriends();
      getCurrentLocation();
    }
  }, [authToken]);

  const loadFriends = async () => {
    try {
      const response = await fetch(`${API_URL}/friends`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setFriends(data.friends);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load friends');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for this feature');
        return;
      }
      const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation({
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not get current location');
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users?search=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.users);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search users');
    }
  };

  const addFriend = async (friendId) => {
    try {
      const response = await fetch(`${API_URL}/friends/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ friendId })
      });
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Friend added successfully!');
        loadFriends();
        setSearchResults([]);
        setSearchQuery('');
      } else {
        Alert.alert('Error', data.error || 'Failed to add friend');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add friend');
    }
  };

  const removeFriend = async (friendId) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/friends/remove/${friendId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${authToken}`
                }
              });
              
              if (response.ok) {
                Alert.alert('Success', 'Friend removed successfully!');
                loadFriends();
              } else {
                const data = await response.json();
                Alert.alert('Error', data.error || 'Failed to remove friend');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  const scrollToBottom = () => {
    if (messagesListRef.current && messages.length > 0) {
      messagesListRef.current.scrollToEnd({ animated: true });
    }
  };

  const loadConversation = async (friendId) => {
    try {
      const response = await fetch(`${API_URL}/messages/conversation/${friendId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages);
        setCurrentConversation(friendId);
        setNewMessage('');
        setMessagePassword('');
        setTimeout(() => {
          if (messagesListRef.current) {
            messagesListRef.current.scrollToEnd({ animated: false });
          }
        }, 100);
      } else {
        Alert.alert('Error', data.error || 'Failed to load conversation');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load conversation');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !messagePassword.trim() || !location) {
      Alert.alert('Error', 'Please enter message, password, and select a location');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/messages/send-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          recipientId: currentConversation,
          message: newMessage,
          password: messagePassword,
          location: {
            ...location,
            name: locationName || 'Selected Location'
          }
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNewMessage('');
        setMessagePassword('');
        setLocation(null);
        setLocationName('');
        setSelectedLocation(null);
        setTimeout(() => {
          loadConversation(currentConversation);
          setTimeout(() => {
            if (messagesListRef.current) {
              messagesListRef.current.scrollToEnd({ animated: true });
            }
          }, 100);
        }, 100);
        Alert.alert('Success', 'Message sent successfully!');
      } else {
        Alert.alert('Error', data.error || 'Failed to send message');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const getMessagePassword = async (messageId) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/messages/get-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          messageId: messageId,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Password Received!', `Password: ${data.password}\n\nYou can now decrypt the message.`);
        setPasswordInputs((prev) => ({ ...prev, [messageId]: data.password }));
      } else {
        Alert.alert('Error', data.error || 'Failed to get password');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get password');
    }
  };

  const decryptLocationMessage = async (messageId, password) => {
    try {
      const response = await fetch(`${API_URL}/messages/decrypt-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ messageId, password })
      });
      const data = await response.json();
      if (response.ok) {
        setDecryptedMessages((prev) => ({ ...prev, [messageId]: data.message }));
      } else {
        Alert.alert('Error', data.error || 'Failed to decrypt message');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to decrypt message');
    }
  };

  // Copy location handler
  const handleCopyLocation = async (location) => {
    if (location) {
      const coords = `${location.latitude},${location.longitude}`;
      await Clipboard.setStringAsync(coords);
      Alert.alert('Copied', 'Coordinates copied to clipboard!');
    }
  };

  // Get directions handler
  const handleGetDirections = async () => {
    let coords = '';
    try {
      coords = await Clipboard.getStringAsync();
    } catch {}
    Alert.prompt(
      'Paste Coordinates',
      'Paste latitude,longitude to get directions to the location.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Go',
          onPress: async (input) => {
            const value = (input || coords || '').trim();
            const match = value.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
            if (!match) {
              Alert.alert('Invalid', 'Please enter valid coordinates in the format: latitude,longitude');
              return;
            }
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            const url = Platform.select({
              ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
              android: `geo:0,0?q=${lat},${lng}`,
              default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            });
            Linking.openURL(url);
          },
        },
      ],
      'plain-text',
      coords
    );
  };

  const renderFriendItem = ({ item }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>
      <View style={styles.friendActions}>
        <TouchableOpacity 
          style={styles.messageButton}
          onPress={() => {
            setSelectedFriend(item);
            loadConversation(item.id);
            setActiveTab('conversations');
          }}
        >
          <Text style={styles.messageButtonText}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeFriend(item.id)}
        >
          <Text style={styles.removeButtonText}>❌</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResult = ({ item }) => (
    <View style={styles.searchItem}>
      <View style={styles.searchInfo}>
        <Text style={styles.searchName}>{item.name}</Text>
        <Text style={styles.searchEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => addFriend(item.id)}
      >
        <Text style={styles.addButtonText}>Add Friend</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.isFromMe ? styles.myMessageBubble : styles.theirMessageBubble
    ]}>
      <View style={styles.messageMetaRow}>
        <Text style={styles.messageSender}>
          {item.isFromMe ? 'You' : selectedFriend?.name || 'Friend'}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {item.location && (
        <View style={styles.messageLocationBoxClean}>
          <TouchableOpacity onPress={() => handleCopyLocation(item.location)}>
            <Text style={styles.locationInfoCopyable}>
              📍 {item.location.name} ({item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.getDirectionsButton} onPress={handleGetDirections}>
            <Text style={styles.getDirectionsButtonText}>Get Directions</Text>
          </TouchableOpacity>
          {!item.isFromMe && !decryptedMessages[item.id] && (
            <Text style={styles.locationInstructionClean}>
              Go to this location to get the password and decrypt this message
            </Text>
          )}
        </View>
      )}
      {decryptedMessages[item.id] ? (
        <View style={styles.decryptedMessageContentClean}>
          <Text style={styles.messageTextClean}>{decryptedMessages[item.id]}</Text>
          <Text style={styles.statusTextClean}>✓ Read</Text>
        </View>
      ) : (
        <View style={styles.encryptedMessageContentClean}>
          <View style={styles.encryptedHeaderClean}>
            <Text style={styles.encryptedIconClean}>🔒</Text>
            <Text style={styles.encryptedTextClean}>Encrypted Message</Text>
          </View>
          <View style={styles.decryptContainerClean}>
            <TextInput
              style={styles.decryptPasswordInputClean}
              placeholder="Enter password to decrypt"
              value={passwordInputs[item.id] || ''}
              secureTextEntry
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              textContentType="none"
              accessibilityLabel="Message decryption password"
              placeholderTextColor="#95a5a6"
              onChangeText={(text) => setPasswordInputs((prev) => ({ ...prev, [item.id]: text }))}
              onSubmitEditing={() => decryptLocationMessage(item.id, passwordInputs[item.id])}
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={[styles.decryptButtonClean, !passwordInputs[item.id]?.trim() && styles.decryptButtonDisabledClean]}
              onPress={() => decryptLocationMessage(item.id, passwordInputs[item.id])}
              disabled={!passwordInputs[item.id]?.trim() || decryptingMessages[item.id]}
            >
              <Text style={[styles.decryptButtonTextClean, !passwordInputs[item.id]?.trim() && styles.decryptButtonTextDisabledClean]}>
                {decryptingMessages[item.id] ? 'Decrypting...' : 'Decrypt'}
              </Text>
            </TouchableOpacity>
            {!item.isFromMe && (
              <TouchableOpacity 
                style={styles.decryptButtonClean}
                onPress={() => getMessagePassword(item.id)}
              >
                <Text style={styles.decryptButtonTextClean}>Get Password</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabInfo}>{tabInfo.friends}</Text>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Friends ({friends.length})</Text>
              <TouchableOpacity 
                style={styles.addFriendButton}
                onPress={() => setActiveTab('search')}
              >
                <Text style={styles.addFriendButtonText}>+ Add Friend</Text>
              </TouchableOpacity>
            </View>
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No friends yet</Text>
                <Text style={styles.emptyStateSubtext}>Search for users to add as friends</Text>
              </View>
            ) : (
              <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.id}
                style={styles.list}
              />
            )}
          </View>
        );

      case 'search':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabInfo}>{tabInfo.search}</Text>
            <View style={styles.searchSection}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchUsers}
              />
              <TouchableOpacity style={styles.searchButton} onPress={searchUsers}>
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              style={styles.list}
            />
          </View>
        );

      case 'conversations':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabInfo}>{tabInfo.conversations}</Text>
            {currentConversation ? (
              <View style={styles.conversationViewClean}>
                <View style={styles.conversationHeaderClean}>
                  <TouchableOpacity 
                    style={styles.backButtonContainer}
                    onPress={() => setActiveTab('friends')}
                  >
                    <Text style={styles.backButtonText}>←</Text>
                  </TouchableOpacity>
                  <View style={styles.conversationInfo}>
                    <Text style={styles.conversationTitle}>{selectedFriend?.name}</Text>
                    <Text style={styles.conversationSubtitle}>{selectedFriend?.email}</Text>
                  </View>
                </View>
                <View style={styles.messagesContainerClean}>
                  {messages.length === 0 ? (
                    <View style={styles.emptyConversation}>
                      <Text style={styles.emptyConversationIcon}>💬</Text>
                      <Text style={styles.emptyConversationText}>No messages yet</Text>
                      <Text style={styles.emptyConversationSubtext}>
                        Start the conversation by sending a message
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={messages}
                      renderItem={renderMessage}
                      keyExtractor={(item) => item.id}
                      style={styles.messagesList}
                      contentContainerStyle={styles.messagesContent}
                      showsVerticalScrollIndicator={true}
                      inverted={false}
                      automaticallyAdjustKeyboardInsets={true}
                      keyboardShouldPersistTaps="handled"
                      ref={messagesListRef}
                      removeClippedSubviews={false}
                      initialNumToRender={10}
                      maxToRenderPerBatch={10}
                      windowSize={10}
                      getItemLayout={(data, index) => ({
                        length: 80,
                        offset: 80 * index,
                        index,
                      })}
                    />
                  )}
                </View>
                <View style={styles.messageInputCardCleanOuter}>
                  <View style={styles.messageInputCardClean}>
                    <Text style={styles.inputLabelClean}>Message</Text>
                    <Text style={styles.inputHint}>Type your message. Only your friend and you can decrypt it.</Text>
                    <TextInput
                      style={styles.messageInputClean}
                      placeholder="Type your message..."
                      value={newMessage}
                      onChangeText={setNewMessage}
                      multiline
                      maxLength={1000}
                      autoComplete="off"
                      autoCorrect={false}
                      accessibilityLabel="Message text input"
                      placeholderTextColor="#95a5a6"
                      key={`message-input-${currentConversation}`}
                    />
                    <View style={styles.divider} />
                    <Text style={styles.inputLabelClean}>Password</Text>
                    <Text style={styles.inputHint}>Set a password for this message. Share it privately with your friend.</Text>
                    <TextInput
                      style={styles.messagePasswordInputClean}
                      placeholder="Message password (required)"
                      value={messagePassword}
                      onChangeText={setMessagePassword}
                      secureTextEntry
                      autoComplete="off"
                      autoCorrect={false}
                      autoCapitalize="none"
                      textContentType="none"
                      accessibilityLabel="Message encryption password"
                      placeholderTextColor="#95a5a6"
                      key={`password-input-${currentConversation}`}
                    />
                    <View style={styles.divider} />
                    <Text style={styles.inputLabelClean}>Location</Text>
                    <Text style={styles.inputHint}>Set the required location for this message. Your friend must be at this location to decrypt.</Text>
                    <View style={styles.locationButtonRowClean}>
                      <TouchableOpacity style={styles.locationButtonClean} onPress={() => setShowMap(true)}>
                        <Text style={styles.locationButtonTextClean}>{location ? 'Change Location' : 'Set Location'}</Text>
                      </TouchableOpacity>
                    </View>
                    {location && (
                      <View style={styles.selectedLocationDisplayClean}>
                        <Text style={styles.selectedLocationTextClean}>
                          📍 {locationName || 'Selected Location'} ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={[styles.sendButtonClean, (!newMessage.trim() || !messagePassword.trim() || !location) && styles.sendButtonDisabledClean]}
                      onPress={sendMessage}
                      disabled={!newMessage.trim() || !messagePassword.trim() || !location}
                    >
                      <Text style={[styles.sendButtonTextClean, (!newMessage.trim() || !messagePassword.trim() || !location) && styles.sendButtonTextDisabledClean]}>
                        Send
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>💬</Text>
                <Text style={styles.emptyStateText}>Select a friend to start chatting</Text>
                <Text style={styles.emptyStateSubtext}>
                  Go to the Friends tab and tap the message button
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  // Address search handler
  const handleAddressSearch = async () => {
    if (!addressQuery.trim()) {
      setAddressResults([]);
      return;
    }
    setIsSearchingAddress(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery.trim())}`);
      const data = await response.json();
      // Map to expected format: { latitude, longitude, display_name }
      const results = data.map(item => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        display_name: item.display_name
      }));
      setAddressResults(results);
    } catch (e) {
      setAddressResults([]);
    }
    setIsSearchingAddress(false);
  };

  return (
    <View style={styles.messagingContainerClean}>
      <View style={styles.messagingHeaderClean}>
        <TouchableOpacity onPress={() => onNavigate('home')} style={styles.messagingBackBtnClean}>
          <Text style={styles.messagingBackBtnTextClean}>← Home</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', pointerEvents: 'none' }}>
          <Text style={[styles.messagingPageTitleClean, { marginTop: 40 }]}>Messaging</Text>
        </View>
      </View>
      <View style={styles.messagingTabBarClean}>
        <TouchableOpacity 
          style={[styles.messagingTabClean, activeTab === 'friends' && styles.messagingActiveTabClean]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.messagingTabTextClean, activeTab === 'friends' && styles.messagingActiveTabTextClean]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.messagingTabClean, activeTab === 'search' && styles.messagingActiveTabClean]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.messagingTabTextClean, activeTab === 'search' && styles.messagingActiveTabTextClean]}>
            Search Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.messagingTabClean, activeTab === 'conversations' && styles.messagingActiveTabClean]}
          onPress={() => setActiveTab('conversations')}
        >
          <Text style={[styles.messagingTabTextClean, activeTab === 'conversations' && styles.messagingActiveTabTextClean]}>
            Conversations
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.messagingTabContentCardClean}>
        {renderTabContent()}
      </View>

      <Modal visible={showMap} animationType="slide">
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: currentLocation?.latitude || 37.78825,
              longitude: currentLocation?.longitude || -122.4324,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={event => setSelectedLocation(event.nativeEvent.coordinate)}
            region={selectedLocation ? {
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            } : undefined}
          >
            {currentLocation && (
              <Marker
                coordinate={currentLocation}
                title="Your Location"
                pinColor="blue"
              />
            )}
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Selected Location"
                pinColor="red"
              />
            )}
            {selectedLocation && (
              <Circle
                center={selectedLocation}
                radius={50}
                strokeColor="rgba(255, 0, 0, 0.5)"
                fillColor="rgba(255, 0, 0, 0.2)"
              />
            )}
          </MapView>
          {/* Address Search Bar and Results BELOW the map */}
          <View style={styles.addressSearchBarContainer}>
            <TextInput
              style={styles.addressSearchInput}
              placeholder="Search address..."
              value={addressQuery}
              onChangeText={setAddressQuery}
              onSubmitEditing={handleAddressSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.addressSearchButton} onPress={handleAddressSearch}>
              <Text style={styles.addressSearchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
          {isSearchingAddress && (
            <ActivityIndicator size="small" color="#3498db" style={{margin: 8}} />
          )}
          {addressResults.length > 0 && (
            <View style={styles.addressResultsList}>
              {addressResults.map((result, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.addressResultItem}
                  onPress={() => {
                    setSelectedLocation({ latitude: result.latitude, longitude: result.longitude });
                    setLocationName(result.display_name);
                    setAddressQuery('');
                    setAddressResults([]);
                  }}
                >
                  <Text style={styles.addressResultText}>{result.display_name} ({result.latitude.toFixed(4)}, {result.longitude.toFixed(4)})</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.mapButton} onPress={() => setShowMap(false)}>
              <Text style={styles.mapButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapButton} onPress={() => {
              if (selectedLocation) {
                setLocation(selectedLocation);
                setShowMap(false);
              } else {
                Alert.alert('Error', 'Please select a location on the map');
              }
            }}>
              <Text style={styles.mapButtonText}>Confirm Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapButton} onPress={() => {
              if (currentLocation) {
                setSelectedLocation(currentLocation);
              } else {
                Alert.alert('Error', 'Current location not available');
              }
            }}>
              <Text style={styles.mapButtonText}>Use My Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  messagingContainerClean: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 0,
    borderRadius: 16,
    minHeight: 400,
  },
  messagingHeaderClean: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 2,
  },
  messagingBackBtnClean: {
    backgroundColor: 'rgba(52,152,219,0.07)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
  },
  messagingBackBtnTextClean: {
    color: '#3498db',
    fontSize: 15,
    fontWeight: '600',
  },
  messagingPageTitleClean: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  messagingTabBarClean: {
    flexDirection: 'row',
    backgroundColor: '#f5fafd',
    marginHorizontal: 18,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    marginTop: 2,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  messagingTabClean: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  messagingActiveTabClean: {
    backgroundColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  messagingTabTextClean: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  messagingActiveTabTextClean: {
    color: 'white',
  },
  messagingTabContentCardClean: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 0,
    minHeight: 300,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
    paddingHorizontal: 20,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3498db',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addFriendButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addFriendButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  friendItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  friendEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 10,
  },
  messageButton: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 6,
  },
  messageButtonText: {
    color: 'white',
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 6,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  searchSection: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  searchButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  searchItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInfo: {
    flex: 1,
  },
  searchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  searchEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  conversationViewClean: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 0,
  },
  conversationHeaderClean: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButtonContainer: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 20,
    marginRight: 15,
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  conversationSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  messagesContainerClean: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginBottom: 0,
    paddingBottom: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyConversation: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyConversationIcon: {
    fontSize: 48,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  emptyConversationText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  emptyConversationSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 8,
  },
  messageInputCardCleanOuter: {
    backgroundColor: '#f5fafd',
    paddingVertical: 6,
    paddingHorizontal: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  messageInputCardClean: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputLabelClean: {
    fontSize: 13,
    color: '#34495e',
    marginBottom: 2,
    marginTop: 8,
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 4,
    marginTop: -2,
    marginLeft: 2,
    flexWrap: 'wrap',
  },
  messageInputClean: {
    borderWidth: 0,
    borderRadius: 7,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 14,
    color: '#2c3e50',
    minHeight: 32,
    maxHeight: 60,
    marginBottom: 0,
    marginTop: 2,
  },
  messagePasswordInputClean: {
    borderWidth: 0,
    borderRadius: 7,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 14,
    color: '#2c3e50',
    minHeight: 32,
    marginBottom: 0,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 8,
  },
  locationButtonRowClean: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
  },
  locationButtonClean: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    marginRight: 8,
  },
  locationButtonTextClean: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedLocationDisplayClean: {
    backgroundColor: '#eaf6fb',
    borderRadius: 8,
    padding: 7,
    marginTop: 4,
    marginBottom: 4,
    minWidth: 0,
  },
  selectedLocationTextClean: {
    color: '#2980b9',
    fontSize: 14,
    fontWeight: '500',
    flexWrap: 'wrap',
  },
  sendButtonClean: {
    backgroundColor: '#27ae60',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
    width: '100%',
  },
  sendButtonDisabledClean: {
    backgroundColor: '#d3d3d3',
  },
  sendButtonTextClean: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sendButtonTextDisabledClean: {
    color: '#95a5a6',
  },
  messageBubble: {
    marginVertical: 8,
    padding: 14,
    borderRadius: 18,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    backgroundColor: '#fff',
  },
  myMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#eaf6fb',
  },
  theirMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5fafd',
  },
  messageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  messageSender: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 11,
    color: '#b2bec3',
  },
  messageLocationBoxClean: {
    backgroundColor: '#f1f8e9',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    marginTop: 2,
  },
  locationInfoCopyable: {
    color: '#2980b9',
    fontSize: 13,
    fontWeight: '500',
  },
  locationInstructionClean: {
    color: '#7f8c8d',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  decryptedMessageContentClean: {
    backgroundColor: '#ecf0f1',
    borderRadius: 14,
    padding: 10,
    marginTop: 4,
  },
  messageTextClean: {
    color: '#2c3e50',
    fontSize: 15,
    lineHeight: 20,
  },
  statusTextClean: {
    fontSize: 10,
    color: '#27ae60',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'right',
  },
  encryptedMessageContentClean: {
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    padding: 10,
    marginTop: 4,
  },
  encryptedHeaderClean: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  encryptedIconClean: {
    fontSize: 16,
    marginRight: 6,
  },
  encryptedTextClean: {
    fontSize: 13,
    color: '#6c757d',
    fontWeight: '500',
  },
  decryptContainerClean: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  decryptPasswordInputClean: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: 'white',
    color: '#2c3e50',
    height: 32,
  },
  decryptButtonClean: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  decryptButtonDisabledClean: {
    backgroundColor: '#bdc3c7',
  },
  decryptButtonTextClean: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  decryptButtonTextDisabledClean: {
    color: '#7f8c8d',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 8,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  mapButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 6,
  },
  mapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tabInfo: {
    fontSize: 15,
    color: '#3498db',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  copyLocationButton: {
    backgroundColor: '#f5fafd',
    borderWidth: 1,
    borderColor: '#2980b9',
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 8,
  },
  copyLocationButtonText: {
    color: '#2980b9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  addressSearchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5fafd',
    zIndex: 2,
  },
  addressSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: 'white',
    marginRight: 8,
  },
  addressSearchButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addressSearchButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  addressResultsList: {
    backgroundColor: '#fff',
    maxHeight: 120,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginHorizontal: 10,
    marginBottom: 4,
    zIndex: 3,
    elevation: 2,
  },
  addressResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addressResultText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  getDirectionsButton: {
    backgroundColor: '#3498db',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  getDirectionsButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default MessagingScreen; 