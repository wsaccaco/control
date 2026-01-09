import React from 'react';
import { Row, Col, Typography, Space, Button, Switch } from 'antd';
import { SettingOutlined, BellOutlined, EyeOutlined, EyeInvisibleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useComputers } from '../context/ComputerContext';
import { useSettings } from '../context/SettingsContext';
import { ComputerCard } from '../components/ComputerCard';
import { NextToFinishList } from '../components/NextToFinishList';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/pricing';

const { Title, Text } = Typography;

export const Dashboard: React.FC = () => {
    const { computers, getDailyRevenue } = useComputers();
    const { viewMode, toggleViewMode } = useSettings();
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = React.useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');
    const [dailyRevenue, setDailyRevenue] = React.useState(0);
    const [revenueVisible, setRevenueVisible] = React.useState(false);

    React.useEffect(() => {
        getDailyRevenue().then(res => setDailyRevenue(res.total));
    }, [getDailyRevenue]);

    const handleRefreshRevenue = () => {
        getDailyRevenue().then(res => setDailyRevenue(res.total));
    };

    const available = computers.filter(c => c.status === 'available').length;
    const occupied = computers.filter(c => c.status === 'occupied').length;
    const maintenance = computers.filter(c => c.status === 'maintenance').length;

    const filteredComputers = computers.filter(c => statusFilter === 'all' || c.status === statusFilter);

    const handleFilterClick = (status: 'available' | 'occupied' | 'maintenance') => {
        setStatusFilter(prev => prev === status ? 'all' : status);
    };


    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <div className="dashboard-title-area" style={{ flex: '1 1 auto', minWidth: '300px' }}>
                    <Title level={2} style={{ margin: 0 }}>Panel de Control</Title>
                    <div className="dashboard-stats" style={{ marginTop: '5px' }}>
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

                <div className="dashboard-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'flex-end', flex: '1 1 auto' }}>

                    {/* Daily Revenue Widget */}
                    <div style={{ marginRight: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Text type="secondary" style={{ marginRight: 4, fontSize: '14px' }}>Venta Hoy:</Text>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.05)', padding: '2px 12px', borderRadius: '16px' }}>
                            <Text strong style={{ fontSize: '16px', color: '#13c2c2', marginRight: '8px', minWidth: '60px', textAlign: 'center' }}>
                                {revenueVisible ? formatCurrency(dailyRevenue) : '••••••'}
                            </Text>
                            <Button
                                type="text"
                                size="small"
                                icon={revenueVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                onClick={() => setRevenueVisible(!revenueVisible)}
                                style={{ color: '#8c8c8c', minWidth: '24px', height: '24px' }}
                            />
                        </div>
                        <Button
                            type="text"
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={handleRefreshRevenue}
                            title="Actualizar Monto"
                            style={{ marginLeft: 0, color: '#8c8c8c' }}
                        />
                    </div>

                    {/* Notification Button - Only show if supported and permission is default */}
                    {'Notification' in window && Notification.permission === 'default' && (
                        <Button
                            type="dashed"
                            icon={<BellOutlined />}
                            onClick={() => {
                                Notification.requestPermission().then(() => {
                                    navigate(0);
                                });
                            }}
                            size="small"
                        >
                            Activar Alertas
                        </Button>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text strong>Vista:</Text>
                        <Switch
                            checkedChildren="Transcurrido"
                            unCheckedChildren="Restante"
                            checked={viewMode === 'elapsed'}
                            onChange={toggleViewMode}
                        />
                    </div>

                    <Button icon={<SettingOutlined />} onClick={() => navigate('/settings')}>Configurar</Button>
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
