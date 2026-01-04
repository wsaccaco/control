import React from 'react';
import { Row, Col, Typography, Space, Button, Switch } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useComputers } from '../context/ComputerContext';
import { useSettings } from '../context/SettingsContext';
import { ComputerCard } from '../components/ComputerCard';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const Dashboard: React.FC = () => {
    const { computers } = useComputers();
    const { viewMode, toggleViewMode } = useSettings();
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = React.useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');

    const available = computers.filter(c => c.status === 'available').length;
    const occupied = computers.filter(c => c.status === 'occupied').length;
    const maintenance = computers.filter(c => c.status === 'maintenance').length;

    const filteredComputers = computers.filter(c => statusFilter === 'all' || c.status === statusFilter);

    const handleFilterClick = (status: 'available' | 'occupied' | 'maintenance') => {
        setStatusFilter(prev => prev === status ? 'all' : status);
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Panel de Control</Title>
                    <Space split={<div style={{ width: 1, height: '1em', backgroundColor: '#d9d9d9' }} />} style={{ marginTop: 8 }}>
                        <span
                            style={{ cursor: 'pointer', opacity: statusFilter === 'all' || statusFilter === 'available' ? 1 : 0.3, fontWeight: statusFilter === 'available' ? 'bold' : 'normal' }}
                            onClick={() => handleFilterClick('available')}
                        >
                            <Text type="success">Libres: {available}</Text>
                        </span>
                        <span
                            style={{ cursor: 'pointer', opacity: statusFilter === 'all' || statusFilter === 'occupied' ? 1 : 0.3, fontWeight: statusFilter === 'occupied' ? 'bold' : 'normal' }}
                            onClick={() => handleFilterClick('occupied')}
                        >
                            <Text type="danger">Ocupadas: {occupied}</Text>
                        </span>
                        <span
                            style={{ cursor: 'pointer', opacity: statusFilter === 'all' || statusFilter === 'maintenance' ? 1 : 0.3, fontWeight: statusFilter === 'maintenance' ? 'bold' : 'normal' }}
                            onClick={() => handleFilterClick('maintenance')}
                        >
                            <Text type="secondary">Mantenimiento: {maintenance}</Text>
                        </span>
                    </Space>
                </div>
                <Space>
                    <Space size={8} style={{ marginRight: 16 }}>
                        <Text strong>Vista:</Text>
                        <Switch
                            checkedChildren="Transcurrido"
                            unCheckedChildren="Restante"
                            checked={viewMode === 'elapsed'}
                            onChange={toggleViewMode}
                        />
                    </Space>
                    <Button icon={<SettingOutlined />} onClick={() => navigate('/settings')}>Configuración</Button>
                </Space>
            </div>

            <Row gutter={[16, 16]}>
                {filteredComputers.map(computer => (
                    <Col xs={24} sm={12} md={8} lg={6} xl={4} key={computer.id}>
                        <ComputerCard computer={computer} />
                    </Col>
                ))}
            </Row>
        </div>
    );
};
