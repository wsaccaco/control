import React from 'react';
import './App.css';
import { ConfigProvider, Layout, theme, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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
              <Header className="app-header">
                <div className="app-title">
                  LAN Center Control
                </div>
                <Link to="/settings">
                  <Button type="text" icon={<SettingOutlined style={{ fontSize: '20px', color: 'white' }} />} />
                </Link>
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
