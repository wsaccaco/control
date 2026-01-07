import React from 'react';
import { Row, Col, Typography, Space, Button, Switch } from 'antd';
import { SettingOutlined, BellOutlined } from '@ant-design/icons';
import { useComputers } from '../context/ComputerContext';
import { useSettings } from '../context/SettingsContext';
import { ComputerCard } from '../components/ComputerCard';
import { NextToFinishList } from '../components/NextToFinishList';
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
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="dashboard-title-area">
                    <Title level={2} style={{ margin: 0 }}>Panel de Control</Title>
                    <div className="dashboard-stats">
                        <span
                            style={{ cursor: 'pointer', opacity: statusFilter === 'all' || statusFilter === 'available' ? 1 : 0.3, fontWeight: statusFilter === 'available' ? 'bold' : 'normal' }}
                            onClick={() => handleFilterClick('available')}
                        >
                            <Text type="success">Libres: {available}</Text>
                        </span>
                        <span>|</span>
                        <span
                            style={{ cursor: 'pointer', opacity: statusFilter === 'all' || statusFilter === 'occupied' ? 1 : 0.3, fontWeight: statusFilter === 'occupied' ? 'bold' : 'normal' }}
                            onClick={() => handleFilterClick('occupied')}
                        >
                            <Text type="danger">Ocupadas: {occupied}</Text>
                        </span>
                        <span>|</span>
                        <span
                            style={{ cursor: 'pointer', opacity: statusFilter === 'all' || statusFilter === 'maintenance' ? 1 : 0.3, fontWeight: statusFilter === 'maintenance' ? 'bold' : 'normal' }}
                            onClick={() => handleFilterClick('maintenance')}
                        >
                            <Text type="secondary">Mantenimiento: {maintenance}</Text>
                        </span>
                    </div>
                </div>
                <div className="dashboard-controls">
                    <Space size={8}>
                        {Notification.permission === 'default' && (
                            <Button
                                type="dashed"
                                icon={<BellOutlined />}
                                onClick={() => {
                                    Notification.requestPermission().then(() => {
                                        // Force re-render just in case
                                        navigate(0);
                                    });
                                }}
                            >
                                Activar Notificaciones
                            </Button>
                        )}
                        <Text strong>Vista:</Text>
                        <Switch
                            checkedChildren="Transcurrido"
                            unCheckedChildren="Restante"
                            checked={viewMode === 'elapsed'}
                            onChange={toggleViewMode}
                        />
                    </Space>
                    <Button icon={<SettingOutlined />} onClick={() => navigate('/settings')}>Configuración</Button>
                </div>
            </div>



            <NextToFinishList computers={computers} />

            <Row gutter={[16, 16]}>
                {filteredComputers.map(computer => (
                    <Col xs={24} sm={12} md={8} lg={6} xl={4} key={computer.id}>
                        <ComputerCard computer={computer} />
                    </Col>
                ))}
            </Row>
        </div >
    );
};
