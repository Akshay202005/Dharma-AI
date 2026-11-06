// src/config.js
import Constants from "expo-constants";

const BACKEND_PORT = 8000;

// The app loads its JS from Metro on your laptop, so Metro's address
// (like "192.168.1.5:8081") tells us the laptop's current IP.
// We keep the IP and swap the port for the backend's.
const getHost = () => Constants.expoConfig?.hostUri?.split(":")[0];

// Server root without /api (handy for audio and other static files)
export const SERVER_URL = `http://${getHost()}:${BACKEND_PORT}`;

// API root, used by src/api/client.js
export const API_URL =  `${SERVER_URL}/api`;

// Web client ID from Firebase
export const GOOGLE_WEB_CLIENT_ID = "907285674187-noep67fd5sm0fbirog4fsd3v5rbsccf9.apps.googleusercontent.com";

