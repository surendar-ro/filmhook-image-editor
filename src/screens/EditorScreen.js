import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ViewShot from 'react-native-view-shot';
import { useAuth } from '../context/AuthContext';
import DraggableItem from '../components/DraggableItem';
import { uploadImage } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const EMOJIS = ['❤️', '🔥', '😂', '🎬', '✨', '🚀', '💯', '👍'];

const EditorScreen = () => {
  const [image, setImage] = useState(null);
  const [items, setItems] = useState([]); // { id, type, content, color, size }
  const [inputText, setInputText] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const viewShotRef = useRef();
  const { logout } = useAuth();

  const pickImage = async (source) => {
    let result;
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    };

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setItems([]); // Clear overlays when new image picked
    }
  };

  const addText = () => {
    if (inputText.trim()) {
      setItems([
        ...items,
        {
          id: Date.now().toString(),
          type: 'text',
          content: inputText,
          color: '#000',
          size: 24,
        },
      ]);
      setInputText('');
      setShowTextModal(false);
    }
  };

  const addEmoji = (emoji) => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        type: 'emoji',
        content: emoji,
        size: 40,
      },
    ]);
    setShowEmojiModal(false);
  };

  const handleUpload = async () => {
    if (!image) {
      Alert.alert('Error', 'Please pick an image first');
      return;
    }

    setUploading(true);
    try {
      // Capture the edited image
      const uri = await viewShotRef.current.capture();
      
      // Upload to API
      const response = await uploadImage(uri);
      
      Alert.alert('Success', 'Image uploaded successfully!', [
        { text: 'OK', onPress: () => {
          setImage(null);
          setItems([]);
        }}
      ]);
      console.log('Upload Response:', response);
    } catch (error) {
      Alert.alert('Upload Error', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Image Editor</Text>
        <TouchableOpacity onPress={logout}>
          <Ionicons name="log-out-outline" size={28} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Editor Canvas */}
      <View style={styles.canvasContainer}>
        {image ? (
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'jpg', quality: 0.9 }}
            style={styles.canvas}
          >
            <Image source={{ uri: image }} style={styles.image} />
            {items.map((item) => (
              <DraggableItem key={item.id}>
                {item.type === 'text' ? (
                  <Text style={[styles.overlayText, { color: item.color, fontSize: item.size }]}>
                    {item.content}
                  </Text>
                ) : (
                  <Text style={{ fontSize: item.size }}>{item.content}</Text>
                )}
              </DraggableItem>
            ))}
          </ViewShot>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={80} color="#ccc" />
            <Text style={styles.placeholderText}>No Image Selected</Text>
          </View>
        )}
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollToolbar}>
          <TouchableOpacity style={styles.toolButton} onPress={() => pickImage('gallery')}>
            <Ionicons name="images" size={24} color="#4A90E2" />
            <Text style={styles.toolText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={() => pickImage('camera')}>
            <Ionicons name="camera" size={24} color="#4A90E2" />
            <Text style={styles.toolText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={() => setShowTextModal(true)} disabled={!image}>
            <Ionicons name="text" size={24} color={image ? "#4A90E2" : "#ccc"} />
            <Text style={[styles.toolText, !image && {color: '#ccc'}]}>Text</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={() => setShowEmojiModal(true)} disabled={!image}>
            <Ionicons name="happy" size={24} color={image ? "#4A90E2" : "#ccc"} />
            <Text style={[styles.toolText, !image && {color: '#ccc'}]}>Emoji</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Upload Button */}
      {image && (
        <TouchableOpacity 
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]} 
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Capture & Upload</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Text Input Modal */}
      <Modal visible={showTextModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Text</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter text..."
              value={inputText}
              onChangeText={setInputText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowTextModal(false)} style={styles.cancelButton}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addText} style={styles.confirmButton}>
                <Text style={{color: '#fff'}}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Emoji Modal */}
      <Modal visible={showEmojiModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Emoji</Text>
            <FlatList
              data={EMOJIS}
              numColumns={4}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.emojiItem} onPress={() => addEmoji(item)}>
                  <Text style={{fontSize: 32}}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowEmojiModal(false)} style={[styles.cancelButton, {marginTop: 20}]}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    width: '90%',
    aspectRatio: 3/4,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  toolbar: {
    height: 100,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
  },
  scrollToolbar: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  toolButton: {
    alignItems: 'center',
    marginRight: 30,
    width: 60,
  },
  toolText: {
    fontSize: 12,
    marginTop: 5,
    color: '#4A90E2',
  },
  uploadButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  uploadButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  overlayText: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 15,
    flex: 1,
    alignItems: 'center',
  },
  confirmButton: {
    padding: 15,
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  emojiItem: {
    padding: 15,
  }
});

export default EditorScreen;
