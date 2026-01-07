import React from 'react';
import './App.css';
import { ConfigProvider, Layout, theme, Button } from 'antd';
import { SettingOutlined, LogoutOutlined } from '@ant-design/icons';

import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ComputerProvider } from './context/ComputerContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { Content, Header } from 'antd/es/layout/layout';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        <div className="app-title">
          LAN Center Control
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link to="/settings" style={{ display: 'flex', alignItems: 'center' }}>
            <Button type="text" icon={<SettingOutlined style={{ fontSize: '20px', color: 'white' }} />} />
          </Link>
          <Button
            type="text"
            icon={<LogoutOutlined style={{ fontSize: '20px', color: 'white' }} />}
            onClick={logout}
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

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
      <AuthProvider>
        <SettingsProvider>
          <ComputerProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route path="/" element={
                  <RequireAuth>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </RequireAuth>
                } />

                <Route path="/settings" element={
                  <RequireAuth>
                    <MainLayout>
                      <SettingsPage />
                    </MainLayout>
                  </RequireAuth>
                } />
              </Routes>
            </BrowserRouter>
          </ComputerProvider>
        </SettingsProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
