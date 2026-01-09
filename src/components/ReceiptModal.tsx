import React, { useState } from 'react';
import { Modal, Typography, Divider, Table, Button, Flex } from 'antd';
import { PrinterOutlined, CheckCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import type { Computer } from '../types';
import { formatCurrency } from '../utils/pricing';
import dayjs from 'dayjs';

interface ReceiptModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: (price: number) => void;
    computer: Computer;
    finalDurationPrice: number;
}

const { Title, Text } = Typography;

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ visible, onCancel, onConfirm, computer, finalDurationPrice }) => {
    const [showDetails, setShowDetails] = useState(false);

    const extrasTotal = (computer.extras || []).reduce((sum, extra) => sum + extra.price, 0);
    const total = finalDurationPrice + extrasTotal;
    const startTime = computer.startTime ? dayjs(computer.startTime).format('hh:mm A') : '-';
    const endTime = dayjs().format('hh:mm A');
    const duration = computer.startTime ? dayjs().diff(dayjs(computer.startTime), 'minute') : 0;

    const historyData = (computer.history || []).map((h, i) => ({
        key: i,
        time: dayjs(h.time).format('hh:mm A'),
        description: h.description || h.type,
        minutes: h.minutes ? `${h.minutes} min` : '-',
        price: h.price ? formatCurrency(h.price) : '-'
    }));

    const columns = [
        { title: 'Hora', dataIndex: 'time', key: 'time' },
        { title: 'Detalle', dataIndex: 'description', key: 'description' },
        { title: 'Duración', dataIndex: 'minutes', key: 'minutes' },
        { title: 'Costo', dataIndex: 'price', key: 'price', align: 'right' as const },
    ];

    return (
        <Modal
            open={visible}
            onCancel={onCancel}
            footer={null} // Custom footer styling in body or manual footer
            width={400} // Smaller default width
            centered
        >
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <Title level={4} style={{ margin: 0 }}>Total a Cobrar</Title>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#52c41a', margin: '10px 0' }}>
                    {formatCurrency(total)}
                </div>

                <div style={{ marginBottom: 20, color: '#8c8c8c' }}>
                    <div>Cliente: <b>{computer.customerName || 'Cliente'}</b></div>
                    <div>Tiempo: {duration} min</div>
                </div>

                <Button
                    type="link"
                    icon={showDetails ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={() => setShowDetails(!showDetails)}
                    style={{ marginBottom: 16 }}
                >
                    {showDetails ? 'Ocultar Detalles' : 'Ver Detalle del Consumo'}
                </Button>

                {showDetails && (
                    <div style={{ textAlign: 'left', marginBottom: 20 }}>
                        <Table
                            dataSource={historyData}
                            columns={columns}
                            pagination={false}
                            size="small"
                            bordered
                            scroll={{ y: 200 }}
                        />
                        <div style={{ marginTop: 10, textAlign: 'right', fontWeight: 'bold' }}>
                            <div>Tiempo: {formatCurrency(finalDurationPrice)}</div>
                            <div>Extras: {formatCurrency(extrasTotal)}</div>
                        </div>
                    </div>
                )}

                <Flex gap="small" vertical>
                    <Button type="primary" size="large" block icon={<CheckCircleOutlined />} onClick={() => onConfirm(finalDurationPrice)} style={{ height: '50px', fontSize: '18px' }}>
                        COBRAR Y FINALIZAR
                    </Button>
                    <Button block onClick={onCancel}>
                        Cancelar
                    </Button>
                </Flex>
            </div>
        </Modal>
    );
};
