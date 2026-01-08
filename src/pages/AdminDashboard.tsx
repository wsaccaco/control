import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Card, Typography, Modal, message } from 'antd';
import { CloudAuth } from '../services/CloudAuth';

const { Title } = Typography;

export const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = CloudAuth.getToken();
            console.log('Admin Token:', token);

            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log('Users Data:', data);
                setUsers(data);
                if (data.length === 0) message.warning('No se encontraron usuarios');
            } else {
                console.error('Fetch failed:', res.status, res.statusText);
                message.error(`Error ${res.status}: ${res.statusText}`);
            }
        } catch (error: any) {
            console.error('Fetch error:', error);
            message.error(`Error de conexión: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const activateUser = async (userId: string, months: number) => {
        try {
            const token = CloudAuth.getToken();
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, months })
            });
            message.success(`Licencia extendida por ${months} mes(es)`);
            fetchUsers();
        } catch (error) {
            message.error('Error al actualizar');
        }
    };

    const columns = [
        { title: 'Lan Center', dataIndex: 'tenant_name', key: 'tenant_name' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Rol',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => <Tag color={role === 'admin' ? 'gold' : 'blue'}>{role.toUpperCase()}</Tag>
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'green';
                if (status === 'trial') color = 'orange';
                if (status === 'suspended') color = 'red';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Expira',
            dataIndex: 'valid_until',
            key: 'valid_until',
            render: (ts: number) => ts ? new Date(ts).toLocaleDateString() : '-'
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button size="small" type="primary" onClick={() => activateUser(record.id, 1)}>+1 Mes</Button>
                    <Button size="small" onClick={() => activateUser(record.id, 12)}>+1 Año</Button>
                    <Button size="small" danger onClick={() => activateUser(record.id, 0)}>Bloquear</Button>
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Title level={4}>Panel de Administración (SaaS)</Title>
                    <Button onClick={fetchUsers}>Recargar</Button>
                </div>
                <Table
                    dataSource={users}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};
