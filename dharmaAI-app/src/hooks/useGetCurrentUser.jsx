// src/hooks/useGetCurrentUser.js
// Runs once on app start: if a token is saved, ask the backend who it belongs to.
// Only a 401 deletes the token, so being offline doesn't log the user out.
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import api from "../api/client";
import { getToken, removeToken } from "../utils/tokenStorage";
import { setUserData, setAuthChecked } from "../store/userSlice";

export default function useGetCurrentUser() {
    const dispatch = useDispatch();

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken();
                if (token) {
                    const { data } = await api.get("/auth/current");
                    dispatch(setUserData(data));
                }
            } catch (e) {
                if (e.response?.status === 401) await removeToken();
            } finally {
                dispatch(setAuthChecked(true));
            }
        })();
    }, []);
}