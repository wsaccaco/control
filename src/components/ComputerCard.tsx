import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Dropdown, Popconfirm, Flex, Tooltip, Space } from 'antd';
import type { MenuProps } from 'antd';
import { DesktopOutlined, PlayCircleOutlined, StopOutlined, PlusOutlined, MoreOutlined, ToolOutlined, DollarOutlined, FieldTimeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import type { Computer } from '../types';
import { useComputers } from '../context/ComputerContext';
import { useSettings } from '../context/SettingsContext';
import { TimerDisplay } from './TimerDisplay';
import { SessionModal } from './SessionModal';
import { MoveSessionModal } from './MoveSessionModal';
import { AddExtraModal } from './AddExtraModal';
import { ReceiptModal } from './ReceiptModal';
import { SessionProgressBar } from './SessionProgressBar';
import { calculatePrice, formatCurrency } from '../utils/pricing';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

interface ComputerCardProps {
    computer: Computer;
}

export const ComputerCard: React.FC<ComputerCardProps> = ({ computer }) => {
    const { startSession, startOpenSession, stopSession, addTime, toggleMaintenance, togglePaid } = useComputers();
    const { priceRules, currencySymbol, viewMode } = useSettings();
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<'start' | 'add'>('start');
    const [moveModalVisible, setMoveModalVisible] = useState(false);
    const [extraModalVisible, setExtraModalVisible] = useState(false);
    const [receiptVisible, setReceiptVisible] = useState(false);

    // Local state for current price
    const [currentPrice, setCurrentPrice] = useState<number>(0);

    useEffect(() => {
        if (computer.status !== 'occupied') {
            setCurrentPrice(0);
            return;
        }

        const updatePrice = () => {
            let minutes = 0;
            if (computer.mode === 'fixed' && computer.endTime && computer.startTime) {
                // Fixed price is based on total duration requested, NOT elapsed time?
                // Usually user pays for 1h upfront. So price is fixed.
                // OR does the user want "Price so far"? 
                // "se debe mostrar el precio que va hasta el momento" -> ambiguous. 
                // If I buy 1 hour, I owe 1.50 immediately.

                // Let's assume price based on Total Duration of the session.
                const totalDuration = dayjs(computer.endTime).diff(dayjs(computer.startTime), 'minute');
                minutes = totalDuration;
            } else if (computer.mode === 'open' && computer.startTime) {
                const elapsed = dayjs().diff(dayjs(computer.startTime), 'minute');
                minutes = elapsed;
            }

            // Calculate price based on these minutes
            const price = calculatePrice(minutes, priceRules);
            setCurrentPrice(price);
        };

        updatePrice();
        const interval = setInterval(updatePrice, 1000 * 60); // Update every minute
        return () => clearInterval(interval);
    }, [computer, priceRules]);


    const handleStartClick = () => {
        setModalMode('start');
        setModalVisible(true);
    };

    const handleAddClick = () => {
        setModalMode('add');
        setModalVisible(true);
    };

    const onModalConfirm = (minutes: number, customerName?: string) => {
        if (modalMode === 'start') {
            if (minutes === -1) {
                // Open mode
                startOpenSession(computer.id, customerName);
            } else {
                // Fixed mode
                const price = calculatePrice(minutes, priceRules);
                startSession(computer.id, minutes, customerName, price);
            }
        } else {
            // Add time
            if (computer.mode === 'fixed') {
                const price = calculatePrice(minutes, priceRules); // Simplified price for added block
                addTime(computer.id, minutes, price);
            }
        }
        setModalVisible(false);
    };

    const handleStopClick = () => {
        setReceiptVisible(true);
    };

    const confirmStopSession = () => {
        stopSession(computer.id);
        setReceiptVisible(false);
    };

    const menuItems: MenuProps['items'] = [
        ...(computer.status === 'occupied' ? [{
            key: 'move',
            label: 'Cambiar de PC',
            icon: <DesktopOutlined />,
            onClick: () => setMoveModalVisible(true),
        }, {
            key: 'extra',
            label: 'Agregar Extra/Gasto',
            icon: <PlusOutlined />,
            onClick: () => setExtraModalVisible(true),
        }] : []),
        {
            key: 'maintenance',
            label: computer.status === 'maintenance' ? 'Finalizar Mantenimiento' : 'Poner en Mantenimiento',
            icon: <ToolOutlined />,
            onClick: () => toggleMaintenance(computer.id),
        },
    ];

    const getBorderColor = (status: string, mode?: string) => {
        switch (status) {
            case 'available': return '#52c41a'; // green
            case 'occupied': return mode === 'open' ? '#1890ff' : '#ff4d4f'; // blue (open) or red (fixed)
            case 'maintenance': return '#8c8c8c'; // gray
            default: return 'transparent';
        }
    };

    const total = currentPrice + (computer.extras?.reduce((sum, e) => sum + e.price, 0) || 0);

    return (
        <>
            <Card
                hoverable
                size="small"
                styles={{ body: { padding: '10px' } }}
                style={{
                    borderTop: `3px solid ${getBorderColor(computer.status, computer.mode)}`,
                    opacity: computer.status === 'maintenance' ? 0.75 : 1,
                }}
            >
                {/* Header: Name and Status Badge */}
                <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                        <DesktopOutlined style={{ marginRight: 6, color: getBorderColor(computer.status, computer.mode) }} />
                        {computer.name}
                    </div>
                    <Space size={4}>
                        {computer.status === 'occupied' && (
                            <Tooltip title={computer.isPaid ? "Pagado" : "Pendiente de Pago"}>
                                <Button
                                    size="small"
                                    type={computer.isPaid ? "primary" : "default"}
                                    shape="circle"
                                    icon={<DollarOutlined />}
                                    danger={!computer.isPaid}
                                    onClick={(e) => { e.stopPropagation(); togglePaid(computer.id); }}
                                    style={{ width: 22, height: 22, minWidth: 22, fontSize: 12 }}
                                />
                            </Tooltip>
                        )}
                        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                            <Button type="text" icon={<MoreOutlined />} size="small" style={{ width: 20, height: 20 }} />
                        </Dropdown>
                    </Space>
                </Flex>

                {computer.status === 'occupied' ? (
                    <div style={{ textAlign: 'center' }}>
                        {/* Customer Name */}
                        <div style={{ fontSize: '12px', color: '#595959', marginBottom: 2, height: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {computer.customerName || 'Cliente'}
                        </div>

                        {/* Timer */}
                        <div style={{ transform: 'scale(0.9)' }}>
                            <TimerDisplay endTime={computer.endTime} startTime={computer.startTime} mode={computer.mode} viewMode={viewMode} />
                        </div>

                        {/* Progress Bar (Fixed only) */}
                        {computer.mode === 'fixed' && computer.startTime && computer.endTime && (
                            <SessionProgressBar startTime={computer.startTime} endTime={computer.endTime} />
                        )}

                        {/* Price & Extras */}
                        <Flex justify="center" align="baseline" gap={2} style={{ marginTop: 2 }}>
                            <span style={{ fontWeight: 'bold', color: '#faad14', fontSize: '16px' }}>
                                {formatCurrency(total, currencySymbol)}
                            </span>
                        </Flex>
                        {computer.extras && computer.extras.length > 0 && (
                            <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                                (+ {formatCurrency(computer.extras.reduce((a, b) => a + b.price, 0))} extras)
                            </div>
                        )}

                        {/* Quick Actions Row */}
                        <Flex gap="small" justify="center" style={{ marginTop: 8 }}>
                            {computer.mode === 'fixed' && (
                                <Tooltip title="Añadir Tiempo">
                                    <Button size="small" icon={<FieldTimeOutlined />} onClick={handleAddClick} />
                                </Tooltip>
                            )}
                            <Tooltip title="Agregar Extra / Snack">
                                <Button size="small" icon={<ShoppingCartOutlined />} onClick={() => setExtraModalVisible(true)} />
                            </Tooltip>
                            <Button size="small" type="primary" danger icon={<StopOutlined />} onClick={handleStopClick}>Fin</Button>
                        </Flex>
                    </div>
                ) : computer.status === 'available' ? (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <Tag color="success" style={{ marginBottom: 10 }}>LIBRE</Tag>
                        <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStartClick} block size="small" style={{ backgroundColor: '#52c41a' }}>
                            Iniciar
                        </Button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '10px 0', opacity: 0.6 }}>
                        <Tag color="default">MANTENIMIENTO</Tag>
                        <Button disabled block size="small" style={{ marginTop: 10 }}>Mantenimiento</Button>
                    </div>
                )}
            </Card>

            <SessionModal
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onConfirm={onModalConfirm}
                mode={modalMode}
                computerName={computer.name}
            />

            <MoveSessionModal
                visible={moveModalVisible}
                onCancel={() => setMoveModalVisible(false)}
                sourceComputerId={computer.id}
                sourceComputerName={computer.name}
            />

            <AddExtraModal
                visible={extraModalVisible}
                onCancel={() => setExtraModalVisible(false)}
                computerId={computer.id}
                computerName={computer.name}
            />

            <ReceiptModal
                visible={receiptVisible}
                onCancel={() => setReceiptVisible(false)}
                onConfirm={confirmStopSession}
                computer={computer}
                finalDurationPrice={currentPrice}
            />
        </>
    );
};
