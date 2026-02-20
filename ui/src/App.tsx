import Box from '@mui/material/Box';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { VoiceProvider } from './context/VoiceContext';
import { ModelProvider } from './context/ModelContext';
import LoginPage from './tools/auth/pages/LoginPage';
import SignupPage from './tools/auth/pages/SignupPage';
import ForgotPasswordPage from './tools/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './tools/auth/pages/ResetPasswordPage';
import ProfilePage from './tools/auth/pages/ProfilePage';
import DashboardPage from './tools/dashboard/DashboardPage';
import AgentCallPage from './tools/calls/AgentCallPage';
import AgentsListPage from './tools/agents/pages/AgentsListPage';
import CreateAgentPage from './tools/agents/pages/CreateAgentPage';
import EditAgentPage from './tools/agents/pages/EditAgentPage';
import ContactsPage from './tools/contacts/ContactsPage';
import PromptLibraryPage from './tools/promptlibrary/pages/PromptLibraryPage';
import SettingsPage from './tools/settings/SettingsPage';
import SchedulerPage from './tools/scheduler/SchedulerPage';
import ContactDetailPage from './tools/contacts/ContactDetailPage';
import ApiDocsPage from './tools/apidocs/ApiDocsPage';

const App = () => {
  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
          <VoiceProvider>
          <ModelProvider>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: 'background.default' }}>
              <Header />
              <Box
                component="main"
                sx={{ flex: 1, overflow: 'auto', py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2, md: 3 } }}
              >
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="/agents" element={<ProtectedRoute><AgentsListPage /></ProtectedRoute>} />
                  <Route path="/agents/create" element={<ProtectedRoute><CreateAgentPage /></ProtectedRoute>} />
                  <Route path="/agents/:agentId/edit" element={<ProtectedRoute><EditAgentPage /></ProtectedRoute>} />
                  <Route path="/agents/:agentId/call" element={<ProtectedRoute><AgentCallPage /></ProtectedRoute>} />
                  <Route path="/call" element={<ProtectedRoute><AgentCallPage /></ProtectedRoute>} />
                  <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
                  <Route path="/contacts/:contactId" element={<ProtectedRoute><ContactDetailPage /></ProtectedRoute>} />
                  <Route path="/scheduler" element={<ProtectedRoute><SchedulerPage /></ProtectedRoute>} />
                  <Route path="/prompt-library" element={<ProtectedRoute><PromptLibraryPage /></ProtectedRoute>} />
                  <Route path="/api-docs" element={<ProtectedRoute><ApiDocsPage /></ProtectedRoute>} />

                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Box>
              <Footer />
            </Box>
          </ModelProvider>
          </VoiceProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
