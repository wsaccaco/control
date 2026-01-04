import React from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ComputerProvider } from './context/ComputerContext';
import { SettingsProvider } from './context/SettingsContext';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/SettingsPage';

const { Header, Content } = Layout;

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
      <SettingsProvider>
        <ComputerProvider>
          <BrowserRouter>
            <Layout style={{ minHeight: '100vh' }}>
              <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
                <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                  LAN Center Control
                </div>
              </Header>
              <Content>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </Content>
            </Layout>
          </BrowserRouter>
        </ComputerProvider>
      </SettingsProvider>
    </ConfigProvider>
  );
};

export default App;
