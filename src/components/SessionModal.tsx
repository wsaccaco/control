import React, { useState } from 'react';
import { Modal, Button, InputNumber, Space, Typography, Divider, Input, TimePicker, Checkbox } from 'antd';
import { formatCurrency } from '../utils/pricing';
import { useSettings } from '../context/SettingsContext';
import dayjs from 'dayjs';

const { Text } = Typography;

interface SessionModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: (minutes: number, customerName?: string, startTime?: number) => void;
    mode: 'start' | 'add' | 'edit';
    computerName: string;
    currentDuration?: number;
}

export const SessionModal: React.FC<SessionModalProps> = ({ visible, onCancel, onConfirm, mode, computerName, currentDuration = 0 }) => {
    const { priceRules, currencySymbol } = useSettings();
    const [duration, setDuration] = useState<number>(60);
    const [customDuration, setCustomDuration] = useState<number | null>(null);
    const [customerName, setCustomerName] = useState<string>('');

    // Custom start time state
    const [useCustomStartTime, setUseCustomStartTime] = useState(false);
    const [startTime, setStartTime] = useState<dayjs.Dayjs>(dayjs());

    // Helper to get price for a specific duration for display
    const getPriceLabel = (minutes: number) => {
        // Special case for Open Session
        if (minutes === -1) return "Tiempo Libre";

        const rule = priceRules.find(r => r.minutes === minutes);

        let timeLabel = `${minutes} Min`;
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (mins === 0) {
                timeLabel = `${hours} ${hours === 1 ? 'Hora' : 'Horas'}`;
            } else {
                timeLabel = `${hours} ${hours === 1 ? 'Hora' : 'Horas'} ${mins} Min`;
            }
        }

        if (rule) return `${timeLabel} - ${formatCurrency(rule.price, currencySymbol)}`;
        return timeLabel;
    };

    const handleOk = () => {
        const finalStartTime = useCustomStartTime ? startTime.valueOf() : Date.now();
        onConfirm(customDuration || duration, customerName, finalStartTime);
        reset();
    };

    const reset = () => {
        setCustomDuration(null);
        setDuration(60);
        setCustomerName('');
        setUseCustomStartTime(false);
        setStartTime(dayjs());
    };

    // Filter rules for edit mode
    let displayRules = [...priceRules];
    if (mode === 'edit') {
        // Only show options greater than currentDuration
        displayRules = displayRules.filter(r => r.minutes > currentDuration);
    }

    return (
        <Modal
            title={mode === 'start' ? `Iniciar Sesión - ${computerName}` : mode === 'edit' ? `Actualizar Sesión - ${computerName}` : `Añadir Tiempo - ${computerName}`}
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            okText={mode === 'start' ? "Iniciar" : mode === 'edit' ? "Actualizar" : "Añadir"}
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
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                        {mode === 'edit' ? 'Selecciona nuevo tiempo total:' : 'Selecciona el tiempo de uso:'}
                    </Text>
                    <Space wrap>
                        {displayRules.map(rule => (
                            <Button
                                key={rule.minutes}
                                onClick={() => { setDuration(rule.minutes); setCustomDuration(null); }}
                                type={duration === rule.minutes && !customDuration ? 'primary' : 'default'}
                            >
                                {getPriceLabel(rule.minutes)}
                            </Button>
                        ))}
                        {/* Open Session Option integrated */}
                        {(mode === 'start' || mode === 'edit') && (
                            <Button
                                key="open-session"
                                onClick={() => { setDuration(-1); setCustomDuration(null); }}
                                type={duration === -1 && !customDuration ? 'primary' : 'default'}
                                style={{ borderColor: '#1890ff', color: duration === -1 ? '#fff' : '#1890ff', background: duration === -1 ? '#1890ff' : 'transparent' }}
                            >
                                Tiempo Libre
                            </Button>
                        )}
                    </Space>
                </div>

                {/* Custom Start Time Selector */}
                {mode === 'start' && (
                    <div>
                        <Divider style={{ margin: '12px 0' }} />
                        <Checkbox
                            checked={useCustomStartTime}
                            onChange={(e) => setUseCustomStartTime(e.target.checked)}
                        >
                            Hora de inicio personalizada (anterior)
                        </Checkbox>
                        {useCustomStartTime && (
                            <div style={{ marginTop: 8 }}>
                                <TimePicker
                                    value={startTime}
                                    onChange={(date) => date && setStartTime(date)}
                                    onSelect={(date) => date && setStartTime(date)}
                                    format="HH:mm"
                                    style={{ width: '100%' }}
                                    changeOnScroll
                                />
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text style={{ display: 'block', marginBottom: 8 }}>
                        {mode === 'edit' ? 'O nuevo tiempo total personalizado (minutos):' : 'O tiempo personalizado (minutos):'}
                    </Text>
                    <InputNumber
                        min={mode === 'edit' ? currentDuration + 1 : 1}
                        value={customDuration}
                        onChange={(val) => { setCustomDuration(val); if (val) setDuration(0); }}
                        style={{ width: '100%' }}
                        placeholder={mode === 'edit' ? `Mayor a ${currentDuration}` : "Ej: 45"}
                    />
                </div>
            </Space>
        </Modal>
    );
};
