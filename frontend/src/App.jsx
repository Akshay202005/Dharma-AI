import {Routes, Route, Navigate} from 'react-router'
import Signin from './pages/Signin'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import About from './pages/About'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Contact from './pages/Contact'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import { useSelector } from 'react-redux'
import useGetCurrentUser from './hooks/useGetCurrentUser'

export const serverUrl = "http://localhost:8000"

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#03060C] text-white">Loading...</div>
);

const ProtectedRoute = ({ children }) => {
  const { userData, authChecked } = useSelector((s) => s.user);
  if (!authChecked) return <Loading />;
  return userData ? children : <Navigate to="/signin" replace />;
};

const PublicRoute = ({ children }) => {
  const { userData, authChecked } = useSelector((s) => s.user);
  if (!authChecked) return <Loading />;
  return !userData ? children : <Navigate to="/" replace />;
};

const App = () => {

  useGetCurrentUser();

  return (
    <Routes>

      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Public Routes */}
      <Route path="/signin" element={<PublicRoute><Signin /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Protected Routes */}
      <Route path="/chat/:chatId?" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
