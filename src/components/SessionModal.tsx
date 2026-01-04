import React, { useState } from 'react';
import { Modal, Button, InputNumber, Space, Typography, Divider, Input } from 'antd';
import { formatCurrency } from '../utils/pricing';
import { useSettings } from '../context/SettingsContext';

const { Text } = Typography;

interface SessionModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: (minutes: number, customerName?: string) => void;
    mode: 'start' | 'add';
    computerName: string;
}

export const SessionModal: React.FC<SessionModalProps> = ({ visible, onCancel, onConfirm, mode, computerName }) => {
    const { priceRules, currencySymbol } = useSettings();
    const [duration, setDuration] = useState<number>(60);
    const [customDuration, setCustomDuration] = useState<number | null>(null);
    const [customerName, setCustomerName] = useState<string>('');

    // Helper to get price for a specific duration for display
    const getPriceLabel = (minutes: number) => {
        const rule = priceRules.find(r => r.minutes === minutes);
        if (rule) return `${minutes} Min - ${formatCurrency(rule.price, currencySymbol)}`;
        return `${minutes} Min`;
    };

    const handleOk = () => {
        onConfirm(customDuration || duration, customerName);
        reset();
    };

    const handleOpenMode = () => {
        onConfirm(-1, customerName); // Signal for Open Mode
        reset();
    };

    const reset = () => {
        setCustomDuration(null);
        setDuration(60);
        setCustomerName('');
    };

    return (
        <Modal
            title={mode === 'start' ? `Iniciar Sesión - ${computerName}` : `Añadir Tiempo - ${computerName}`}
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            okText={mode === 'start' ? "Iniciar" : "Añadir"}
            cancelText="Cancelar"
        >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {mode === 'start' && (
                    <div>
                        <Text style={{ display: 'block', marginBottom: 8 }}>Nombre del Cliente (Opcional):</Text>
                        <Input
                            placeholder="Ej. Juan Perez"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            autoFocus
                        />
                    </div>
                )}

                <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Selecciona el tiempo de uso:</Text>
                    <Space wrap>
                        {priceRules.map(rule => (
                            <Button
                                key={rule.minutes}
                                onClick={() => { setDuration(rule.minutes); setCustomDuration(null); }}
                                type={duration === rule.minutes && !customDuration ? 'primary' : 'default'}
                            >
                                {getPriceLabel(rule.minutes)}
                            </Button>
                        ))}
                    </Space>
                </div>

                {mode === 'start' && (
                    <>
                        <Divider style={{ margin: '12px 0' }} />
                        <Button block type="dashed" onClick={handleOpenMode} style={{ borderColor: '#1890ff', color: '#1890ff' }}>
                            Iniciar Tiempo Libre / Abierto
                        </Button>
                    </>
                )}

                <div>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text style={{ display: 'block', marginBottom: 8 }}>O tiempo personalizado (minutos):</Text>
                    <InputNumber
                        min={1}
                        value={customDuration}
                        onChange={(val) => { setCustomDuration(val); if (val) setDuration(0); }}
                        style={{ width: '100%' }}
                        placeholder="Ej: 45"
                    />
                </div>
            </Space>
        </Modal>
    );
};
