import React from 'react';
import './App.css';
import { ConfigProvider, Layout, theme, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ComputerProvider } from './context/ComputerContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

const { Header, Content } = Layout;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        <div className="app-title">
          LAN Center Control
        </div>
        <Link to="/settings">
          <Button type="text" icon={<SettingOutlined style={{ fontSize: '20px', color: 'white' }} />} />
        </Link>
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
