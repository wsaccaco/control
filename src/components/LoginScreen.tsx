import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Layout } from 'antd';
import { UserOutlined, LockOutlined, LaptopOutlined } from '@ant-design/icons';
import { CloudAuth } from '../services/CloudAuth';

const { Title, Text } = Typography;
const { Content } = Layout;

export const LoginScreen: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        setLoading(true);
        setError(null);
        try {
            if (isRegistering) {
                await CloudAuth.register(values.email, values.password, values.tenantName);
                // Auto login after register
                await CloudAuth.login(values.email, values.password);
            } else {
                await CloudAuth.login(values.email, values.password);
            }
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Error al procesar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#001529' }}>
            <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Card style={{ width: 400, textAlign: 'center' }} bordered={false}>
                    <div style={{ marginBottom: 24 }}>
                        <LaptopOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                        <Title level={3}>{isRegistering ? 'Crear Cuenta' : 'Control Lan Center'}</Title>
                        <Text type="secondary">
                            {isRegistering ? 'Registra tu negocio en la nube' : 'Inicia sesión con tu cuenta Cloud'}
                        </Text>
                    </div>

                    {error && (
                        <Alert
                            message={error}
                            type="error"
                            showIcon
                            style={{ marginBottom: 24, textAlign: 'left' }}
                        />
                    )}

                    <Form
                        form={form}
                        name="login"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        size="large"
                    >
                        {isRegistering && (
                            <Form.Item
                                name="tenantName"
                                rules={[{ required: true, message: 'Ingresa el nombre de tu negocio' }]}
                            >
                                <Input prefix={<LaptopOutlined />} placeholder="Nombre del Lan Center" />
                            </Form.Item>
                        )}

                        <Form.Item
                            name="email"
                            rules={[{ required: true, message: 'Ingresa tu correo' }, { type: 'email', message: 'Correo inválido' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Correo Electrónico" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Ingresa tu contraseña' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                {isRegistering ? 'Registrarme e Ingresar' : 'Iniciar Sesión'}
                            </Button>
                        </Form.Item>

                        <Button type="link" onClick={() => setIsRegistering(!isRegistering)}>
                            {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿Nuevo usuario? Crea una cuenta'}
                        </Button>
                    </Form>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 16 }}>
                        v1.0.0 | Licensed Product
                    </Text>
                </Card>
            </Content>
        </Layout>
    );
};
