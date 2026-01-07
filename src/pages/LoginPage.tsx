import React, { useState } from 'react';
import { Card, Input, Button, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!password) return;
        setLoading(true);
        const success = await login(password);
        setLoading(false);

        if (success) {
            message.success('Bienvenido');
            navigate('/');
        } else {
            message.error('Contraseña incorrecta');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#141414'
        }}>
            <Card style={{ width: 300, textAlign: 'center' }}>
                <div style={{ marginBottom: 24 }}>
                    <LockOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                    <Title level={3} style={{ marginTop: 16 }}>Acceso</Title>
                    <Text type="secondary">Ingrese la contraseña de administrador</Text>
                </div>

                <Input.Password
                    placeholder="Contraseña"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onPressEnter={handleLogin}
                    style={{ marginBottom: 16 }}
                    size="large"
                />

                <Button
                    type="primary"
                    block
                    size="large"
                    onClick={handleLogin}
                    loading={loading}
                >
                    Ingresar
                </Button>
            </Card>
        </div>
    );
};
