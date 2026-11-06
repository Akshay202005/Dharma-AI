// src/api/client.js
// x-client-type tells the backend to return the token in the body (cookies don't work well in RN).
// The interceptor then attaches the saved token to every request automatically.
import axios from "axios";
import { API_URL } from "../config";
import { getToken } from "../utils/tokenStorage";

const api = axios.create({
    baseURL: API_URL,
    timeout: 60000,
    headers: { "x-client-type": "mobile" },
});

api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;