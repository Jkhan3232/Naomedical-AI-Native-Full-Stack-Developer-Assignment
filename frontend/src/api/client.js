import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naomedical-ai-native-full-stack-dev-ten.vercel.app/";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
