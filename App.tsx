import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Playground } from './pages/Playground';
import { Auth } from './pages/Auth';
import { getCurrentUser, signOut, signIn } from './services/storage';
import { AppRoute, User } from './types';

function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const existingUser = getCurrentUser();
    if (existingUser) setUser(existingUser);
  }, []);

  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
    setCurrentRoute('playground');
  };

  const handleNavigate = (section: string) => {
    if (currentRoute !== 'dashboard') {
      setCurrentRoute('dashboard');
      setActiveProjectId(null);
      // Allow time for route change before scrolling
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  const handleSignOut = () => {
    signOut();
    setUser(null);
    handleNavigate('home');
  };

  const handleAuthSuccess = (email: string) => {
    const newUser = signIn(email);
    setUser(newUser);
    setCurrentRoute('dashboard');
  };

  return (
    <div className="flex flex-col h-full font-sans">
      {/* Hide Navbar on Auth pages for cleaner look */}
      {currentRoute !== 'signin' && currentRoute !== 'signup' && (
        <Navbar 
          onNavigate={handleNavigate} 
          user={user}
          onSignOut={handleSignOut}
          onSignIn={() => setCurrentRoute('signin')}
        />
      )}
      
      {currentRoute === 'dashboard' && (
        <Dashboard 
          user={user}
          onOpenProject={handleOpenProject} 
          onAuthRequired={() => setCurrentRoute('signin')}
        />
      )}
      
      {currentRoute === 'playground' && activeProjectId && (
        <Playground projectId={activeProjectId} onBack={() => handleNavigate('home')} />
      )}

      {(currentRoute === 'signin' || currentRoute === 'signup') && (
        <Auth 
          mode={currentRoute} 
          onSuccess={handleAuthSuccess}
          onSwitchMode={(mode) => setCurrentRoute(mode)}
        />
      )}
    </div>
  );
}

export default App;