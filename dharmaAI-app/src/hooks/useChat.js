import { Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/client";
import { setChats, upsertChat, removeChat, setActiveChatId, updateChatTitle, setMessages, addMessage, removeMessage, setIsSending, } from "../store/chatSlice";

// Matches chat.routes.js (router mounted at /api/chat; `api` already includes the /api base)
const ENDPOINTS = {
  list: "/chat",                                  // GET    ?q=search  -> { chats }
  open: (id) => `/chat/${id}`,                    // GET               -> { chat, messages }
  send: "/chat/message",                          // POST { chatId?, content }
                                                  //                   -> { chat, userMessage, krishnaMessage }
  remove: (id) => `/chat/${id}`,                  // DELETE
  clearAll: "/chat",                              // DELETE (Profile "Clear Chat History")
  rename: (id) => `/chat/${id}`,                  // PATCH { title } -> { chat }
  audio: (messageId) => `/chat/messages/${messageId}/audio`, // POST (voice, used later)
};

const errorText = (err) =>
  err?.response?.data?.message || "Something went wrong. Please try again.";

export default function useChat() {
  const dispatch = useDispatch();
  const { activeChatId, isSending } = useSelector((s) => s.chat);

  const loadChats = async (q = "") => {
    try {
      const res = await api.get(ENDPOINTS.list, { params: q ? { q } : {} });
      dispatch(setChats(res.data.chats));
    } catch (err) {
      console.log("loadChats error:", err?.response?.data || err.message);
    }
  };

  const openChat = async (id) => {
    dispatch(setActiveChatId(id));
    dispatch(setMessages([]));
    try {
      const res = await api.get(ENDPOINTS.open(id));
      dispatch(setMessages(res.data.messages));
    } catch (err) {
      console.log("openChat error:", err?.response?.data || err.message);
      Alert.alert("Could not load chat", errorText(err));
    }
  };

  const newChat = () => {
    dispatch(setActiveChatId(null));
    dispatch(setMessages([]));
  };

  const deleteChat = async (id) => {
    try {
      await api.delete(ENDPOINTS.remove(id));
      dispatch(removeChat(id));
      if (id === activeChatId) newChat();
    } catch (err) {
      Alert.alert("Could not delete chat", errorText(err));
    }
  };

  const renameChat = async (id, title) => {
    try {
      const res = await api.patch(ENDPOINTS.rename(id), { title });
      const updated = res.data?.chat;
      // use the server's saved title; fall back to what the user typed
      dispatch(updateChatTitle({ _id: id, title: updated?.title || title }));
      return true;
    } catch (err) {
      console.log("renameChat error:", err?.response?.data || err);
      Alert.alert("Could not rename chat", errorText(err));
      return false;
    }
  };

  const clearAllChats = async () => {
    try {
      await api.delete(ENDPOINTS.clearAll);
      dispatch(setChats([]));
      newChat();
      return true;
    } catch (err) {
      Alert.alert("Could not clear history", errorText(err));
      return false;
    }
  };

  // Returns: Krishna's message on success, { limited: true, resetsAt } when every AI model
  // is out of quota (Chat.js shows the banner), or null on any other failure.
  const sendMessage = async (text) => {
    const content = text.trim();
    if (!content || isSending) return null;

    // Show the user's text immediately; swapped for the saved one when the server answers
    const tempId = `temp-${Date.now()}`;
    dispatch(addMessage({ _id: tempId, sender: "User", content }));
    dispatch(setIsSending(true));

    try {
      const res = await api.post(ENDPOINTS.send, {
        // omit chatId for a new conversation (the backend creates the chat)
        ...(activeChatId ? { chatId: activeChatId } : {}),
        content,
      });
      const { chat, userMessage, krishnaMessage } = res.data;

      dispatch(removeMessage(tempId));
      dispatch(addMessage(userMessage));
      dispatch(addMessage(krishnaMessage));

      dispatch(upsertChat(chat));
      if (!activeChatId) dispatch(setActiveChatId(chat._id));
      return krishnaMessage;
    } catch (err) {
      dispatch(removeMessage(tempId));
      const data = err?.response?.data;

      // AI limit (our own code, not the Express "sending too fast" limiter): no alert, show the banner
      if (err?.response?.status === 429 && data?.code === "AI_LIMIT") {
        return { limited: true, resetsAt: Number(data.resetsAt) };
      }

      console.log("sendMessage error:", data || err.message);
      Alert.alert("Message not sent", errorText(err));
      return null;
    } finally {
      dispatch(setIsSending(false));
    }
  };

  return { loadChats, openChat, newChat, deleteChat, clearAllChats, sendMessage, renameChat };
}