// src/utils/tokenStorage.js
// SecureStore uses the phone's encrypted keystore, so use it instead of AsyncStorage for tokens.
import * as SecureStore from "expo-secure-store";

const KEY = "token";
export const saveToken = (token) => SecureStore.setItemAsync(KEY, token);
export const getToken = () => SecureStore.getItemAsync(KEY);
export const removeToken = () => SecureStore.deleteItemAsync(KEY);