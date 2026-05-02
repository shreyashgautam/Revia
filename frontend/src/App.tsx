/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Agent, User, Message } from './types';
import { DEFAULT_AGENTS } from './constants';
import { useAuthBootstrap } from './hooks/useAuth';
import { useRoute } from './hooks/useRoute';
import { AppRoute, isProtectedPage, Page } from './routes';
import { getMe, login, logout, signup } from './services/authService';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import CreateAgent from './pages/CreateAgent';
import Spaces from './pages/Spaces';
import Shell from './components/layout/Shell';

function mapApiUserToUser(user: {
  userId: string;
  email: string;
  name?: string;
  username?: string;
  gender?: string;
  age?: number;
  bio?: string;
  avatar?: string;
  createdAt: string | null;
}): User {
  const email = user.email || 'user@example.com';
  const localPart = email.split('@')[0] || 'user';
  const cleanedLocalPart = localPart.replace(/\d+$/g, '');
  const normalizedName = cleanedLocalPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  const fallbackName = normalizedName || 'User';
  const fallbackUsername = cleanedLocalPart || localPart || 'user';

  return {
    userId: user.userId,
    name: user.name?.trim() || fallbackName,
    username: user.username?.trim() || fallbackUsername,
    email,
    gender: (user.gender || 'male') as User['gender'],
    age: Number(user.age) || 19,
    avatar:
      user.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`,
    bio: user.bio || 'Digital explorer passionate about technology and meaningful conversations.',
    createdAt: user.createdAt,
  };
}

export default function App() {
  const { route, navigate } = useRoute();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [messages, setMessages] = useState<Message[]>([]);
  const { isRestoringSession, authUser, setAuthUser } = useAuthBootstrap();
  const currentPage = route.page;
  const selectedAgentId = route.agentId || null;
  const selectedSpaceId = route.spaceId || null;

  useEffect(() => {
    if (authUser) {
      setCurrentUser(mapApiUserToUser(authUser));
      if (route.page === 'login' || route.page === 'register') {
        navigate({ page: 'dashboard' }, { replace: true });
      }
      return;
    }

    if (!isRestoringSession) {
      setCurrentUser(null);
      if (isProtectedPage(route.page)) {
        navigate({ page: 'login' }, { replace: true });
      }
    }
  }, [authUser, isRestoringSession, route.page, navigate]);

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    const meResponse = await getMe();
    setAuthUser(meResponse.user);
    setCurrentUser(mapApiUserToUser(meResponse.user));
    navigate({ page: 'dashboard' }, { replace: true });
  };

  const handleRegister = async (
    email: string,
    password: string,
    profile: {
      name: string;
      username: string;
      gender: string;
      age: number;
      bio?: string;
    }
  ) => {
    await signup(email, password, profile);
  };

  const handleLogout = () => {
    logout();
    setAuthUser(null);
    setCurrentUser(null);
    navigate({ page: 'login' }, { replace: true });
  };

  const navigateToPage = (page: Page, options?: { agentId?: string | null; spaceId?: string | null; replace?: boolean }) => {
    if (!currentUser && isProtectedPage(page)) {
      navigate({ page: 'login' }, { replace: true });
      return;
    }

    const nextRoute: AppRoute = {
      page,
      agentId: options?.agentId ?? null,
      spaceId: options?.spaceId ?? null,
    };

    navigate(nextRoute, { replace: options?.replace });
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const startChat = (agentId: string, spaceId?: string) => {
    navigateToPage('chat', {
      agentId,
      spaceId: spaceId || null,
    });
  };

  const addAgent = (newAgent: Agent) => {
    setAgents(prev => [newAgent, ...prev]);
    navigateToPage('dashboard');
  };

  const updateAgent = (updatedAgent: Agent) => {
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
  };

  const deleteAgent = (agentId: string) => {
    setAgents(prev => prev.filter(a => a.id !== agentId));
  };

  const togglePin = (agentId: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, isPinned: !a.isPinned } : a));
  };

  const toggleArchive = (agentId: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, isArchived: !a.isArchived } : a));
  };

  if (isRestoringSession) {
    return <div className="min-h-screen bg-[#0A0A0A]" />;
  }

  if (currentPage === 'login') {
    return <Login onLogin={handleLogin} onNavigateToRegister={() => navigateToPage('register')} />;
  }

  if (currentPage === 'register') {
    return <Register onRegister={handleRegister} onNavigateToLogin={() => navigateToPage('login')} />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} onNavigateToRegister={() => navigateToPage('register')} />;
  }

  return (
    <Shell 
      currentPage={currentPage} 
      currentUser={currentUser} 
      onNavigate={(page: Page) => navigateToPage(page)} 
      onLogout={handleLogout}
    >
      {currentPage === 'dashboard' && (
        <Dashboard 
          user={currentUser!} 
          agents={agents}
          onStartChat={startChat} 
          onNavigateToCreate={() => navigateToPage('create-agent')}
          onNavigateToSpaces={(spaceId) => navigateToPage('spaces', { spaceId })}
        />
      )}
      {currentPage === 'chat' && (
        <Chat 
          activeAgentId={selectedAgentId} 
          activeSpaceId={selectedSpaceId}
          agents={agents} 
          onAgentSelect={(id) => {
            navigateToPage('chat', { agentId: id });
          }}
          onDeleteAgent={deleteAgent}
          onTogglePin={togglePin}
          onToggleArchive={toggleArchive}
          onBack={() => {
            if (selectedAgentId) {
              navigateToPage('chat');
            } else {
              navigateToPage('dashboard');
            }
          }}
        />
      )}
      {currentPage === 'profile' && (
        <Profile user={currentUser!} onUpdate={handleUpdateProfile} />
      )}
      {currentPage === 'settings' && (
        <Settings />
      )}
      {currentPage === 'create-agent' && (
        <CreateAgent 
          agents={agents}
          onAddAgent={addAgent} 
          onUpdateAgent={updateAgent}
          onDeleteAgent={deleteAgent}
          onTogglePin={togglePin}
          onToggleArchive={toggleArchive}
        />
      )}
      {currentPage === 'spaces' && (
        <Spaces 
          agents={agents}
          activeSpaceId={selectedSpaceId}
          onNavigateToChat={(agentId, spaceId) => startChat(agentId, spaceId)} 
          onBack={() => navigateToPage('dashboard')}
        />
      )}
    </Shell>
  );
}
