import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Layout } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { socket } from '../services/socket';
import { useSettings } from '../context/SettingsContext';
import { CloudAuth } from '../services/CloudAuth';

const { Title, Text } = Typography;
const { Content } = Layout;

export const OnboardingStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [loading, setLoading] = useState(false);
    const { setPcCount } = useSettings();
    const user = CloudAuth.getUser();

    const onFinish = (values: any) => {
        setLoading(true);
        // Save to backend
        socket.emit('update-settings', {
            lan_center_name: values.name,
            currency_symbol: values.currency || 'S/'
        });

        const count = parseInt(values.pcCount);
        // Initialize computers
        socket.emit('initialize-computers', count);
        setPcCount(count); // Sync local context

        // Also save to CloudAuth user context for immediate local update if needed
        // but normally we rely on backend settings now.
        setTimeout(() => {
            setLoading(false);
            onComplete();
        }, 1000);
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#001529' }}>
            <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Card style={{ width: 500, textAlign: 'center' }} bordered={false}>
                    <div style={{ marginBottom: 24 }}>
                        <ShopOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                        <Title level={3}>¡Bienvenido!</Title>
                        <Text type="secondary">Configura tu Lan Center para empezar.</Text>
                        <div style={{ marginTop: 8 }}>
                            <Button type="link" danger onClick={() => CloudAuth.logout()} size="small">
                                Cerrar Sesión (Usuario Incorrecto)
                            </Button>
                        </div>
                    </div>

                    <Form
                        name="onboarding"
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                        initialValues={{
                            name: user?.lanCenterName,
                            currency: 'S/',
                            pcCount: 10
                        }}
                    >
                        <Form.Item
                            name="name"
                            label="Nombre de tu Lan Center"
                            rules={[{ required: true, message: 'Por favor ingresa un nombre' }]}
                        >
                            <Input placeholder="Ej: Matrix Gaming" />
                        </Form.Item>

                        <Form.Item
                            name="pcCount"
                            label="Cantidad de Equipos"
                            initialValue={10}
                            rules={[{ required: true, message: 'Ingresa la cantidad' }]}
                        >
                            <Input type="number" placeholder="Ej: 10" />
                        </Form.Item>

                        <Form.Item
                            name="currency"
                            label="Símbolo de Moneda"
                            rules={[{ required: true, message: 'Ingresa el símbolo' }]}
                        >
                            <Input placeholder="S/" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                Guardar y Continuar
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Content>
        </Layout>
    );
};
