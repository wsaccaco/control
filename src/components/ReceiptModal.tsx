import React, { useMemo } from 'react';
import { Modal, Typography, Divider, Descriptions, Table, Button } from 'antd';
import { PrinterOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { Computer } from '../types';
import { formatCurrency } from '../utils/pricing';
import dayjs from 'dayjs';

interface ReceiptModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    computer: Computer;
    finalDurationPrice: number; // Calculated outside usually, or we recalculate here
}

const { Title, Text } = Typography;

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ visible, onCancel, onConfirm, computer, finalDurationPrice }) => {

    const extrasTotal = (computer.extras || []).reduce((sum, extra) => sum + extra.price, 0);
    const total = finalDurationPrice + extrasTotal;
    const startTime = computer.startTime ? dayjs(computer.startTime).format('hh:mm A') : '-';
    const endTime = dayjs().format('hh:mm A');
    const duration = computer.startTime ? dayjs().diff(dayjs(computer.startTime), 'minute') : 0;

    // Combine history for table
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
            title="Resumen de Sesión / Recibo"
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>Volver</Button>,
                <Button key="confirm" type="primary" icon={<CheckCircleOutlined />} onClick={onConfirm}>Confirmar y Finalizar</Button>
            ]}
            width={600}
        >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Title level={4}>LAN CENTER</Title>
                <Text type="secondary">{dayjs().format('DD/MM/YYYY')}</Text>
            </div>

            <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Cliente"><b>{computer.customerName || 'Cliente'}</b></Descriptions.Item>
                <Descriptions.Item label="Equipo">{computer.name}</Descriptions.Item>
                <Descriptions.Item label="Inicio">{startTime}</Descriptions.Item>
                <Descriptions.Item label="Fin">{endTime}</Descriptions.Item>
                <Descriptions.Item label="Tiempo Total">{duration} min</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Detalle de Cobros</Divider>

            <Table
                dataSource={historyData}
                columns={columns}
                pagination={false}
                size="small"
                bordered
                summary={() => (
                    <>
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={3} style={{ textAlign: 'right' }}><b>Subtotal Tiempo</b></Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right">{formatCurrency(finalDurationPrice)}</Table.Summary.Cell>
                        </Table.Summary.Row>
                        {extrasTotal > 0 && (
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3} style={{ textAlign: 'right' }}><b>Subtotal Extras</b></Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right">{formatCurrency(extrasTotal)}</Table.Summary.Cell>
                            </Table.Summary.Row>
                        )}
                        <Table.Summary.Row style={{ background: '#fafafa' }}>
                            <Table.Summary.Cell index={0} colSpan={3} style={{ textAlign: 'right' }}><b>TOTAL A PAGAR</b></Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right"><Text type="success" strong>{formatCurrency(total)}</Text></Table.Summary.Cell>
                        </Table.Summary.Row>
                    </>
                )}
            />
        </Modal>
    );
};
