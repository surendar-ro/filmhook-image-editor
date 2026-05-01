import axios from 'axios';

// Using a mock API for demonstration. 
// Replace with actual Filmhook API endpoints.
const API_BASE_URL = 'https://reqres.in/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const loginUser = async (email, password) => {
  try {
    // reqres.in mock login endpoint
    const response = await api.post('/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Login failed';
  }
};

export const uploadImage = async (imageUri) => {
  try {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('file', { uri: imageUri, name: filename, type });

    // Mock upload endpoint (reqres doesn't have one, so we simulate)
    const response = await api.post('/users', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Upload failed';
  }
};

export default api;
