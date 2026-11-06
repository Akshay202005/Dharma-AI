import { useDispatch } from "react-redux";
import { removeToken } from "../utils/tokenStorage";
import { setChats, setActiveChatId, setMessages } from "../store/chatSlice";
import { setUserData } from "../store/userSlice";

// Logging out and deleting the account both end here. Setting userData to null flips
// isAuthenticated to false, so Stack.Protected in _layout.jsx removes the private screens
// and sends the user to a public one: no router.replace needed.
export default function useEndSession() {
  const dispatch = useDispatch();

  return async () => {
    try {
      await removeToken();
    } finally {
      // wipe chats and messages from memory so the next user doesn't see them
      dispatch(setChats([]));
      dispatch(setActiveChatId(null));
      dispatch(setMessages([]));
      dispatch(setUserData(null));
    }
  };
}