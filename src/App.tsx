import React, { useEffect, useState } from 'react';
import './App.css';
import { ConfigProvider, Layout, theme, Button } from 'antd';
import { SettingOutlined, LogoutOutlined, GlobalOutlined } from '@ant-design/icons';

import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ComputerProvider } from './context/ComputerContext';
import { SettingsProvider } from './context/SettingsContext';
// import { AuthProvider, useAuth } from './context/AuthContext'; // Deprecated
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginScreen } from './components/LoginScreen';
import { CloudAuth } from './services/CloudAuth';
import { Content, Header } from 'antd/es/layout/layout';

// Wrapper to handle Cloud Authentication state
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const checkAuth = () => {
    setAuthenticated(CloudAuth.isAuthenticated());
  };

  useEffect(() => {
    checkAuth();

    // Global Error Handler for Socket Auth
    const onConnectError = (err: any) => {
      if (err.message && err.message.includes('Authentication error')) {
        console.error("Authentication failed, logging out...", err);
        CloudAuth.logout();
      }
    };

    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect_error', onConnectError);
    };
  }, []);

  if (authenticated === null) return null; // Loading state

  if (!authenticated) {
    return <LoginScreen onLoginSuccess={() => setAuthenticated(true)} />;
  }

  return <>{children}</>;
};

// Wrapper to handle Onboarding (Name/Settings)
import { socket } from './services/socket';
import { OnboardingStep } from './components/OnboardingStep';

const SetupWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if settings exist (mocked check for now or real socket)
    socket.emit('get-settings', (settings: any) => {
      if (settings && settings.lan_center_name) {
        setSetupComplete(true);
      } else {
        setSetupComplete(false);
      }
    });

    // Listen for updates
    socket.on('settings-update', (settings: any) => {
      if (settings && settings.lan_center_name) {
        setSetupComplete(true);
      }
    });

    return () => {
      socket.off('settings-update');
    };
  }, []);

  if (setupComplete === null) return <div style={{ color: 'white', textAlign: 'center', marginTop: 50 }}>Cargando configuración...</div>;

  if (!setupComplete) {
    return <OnboardingStep onComplete={() => setSetupComplete(true)} />;
  }

  return <>{children}</>;
};

import { useSettings } from './context/SettingsContext';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = CloudAuth.getUser();
  const { generalSettings } = useSettings();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        <div className="app-title">
          {
            generalSettings?.lan_center_name || user?.lanCenterName || 'LAN Center Control'
          }
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user?.role === 'admin' && (
            <Link to="/admin" style={{ display: 'flex', alignItems: 'center' }}>
              <Button type="text" title="Panel SaaS" icon={<GlobalOutlined style={{ fontSize: '20px', color: '#52c41a' }} />} />
            </Link>
          )}
          <Link to="/settings" style={{ display: 'flex', alignItems: 'center' }}>
            <Button type="text" icon={<SettingOutlined style={{ fontSize: '20px', color: 'white' }} />} />
          </Link>
          <Button
            type="text"
            icon={<LogoutOutlined style={{ fontSize: '20px', color: 'white' }} />}
            onClick={() => CloudAuth.logout()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
        </div>
      </Header>
      <Content>
        {children}
      </Content>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AuthWrapper>
        <SettingsProvider>
          <ComputerProvider>
            <SetupWrapper>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  } />

                  <Route path="/settings" element={
                    <MainLayout>
                      <SettingsPage />
                    </MainLayout>
                  } />

                  <Route path="/admin" element={
                    <MainLayout>
                      <AdminDashboard />
                    </MainLayout>
                  } />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </SetupWrapper>
          </ComputerProvider>
        </SettingsProvider>
      </AuthWrapper>
    </ConfigProvider>
  );
};

export default App;
