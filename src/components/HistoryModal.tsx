import React, { useState, useEffect } from 'react';
import { Modal, Table, Typography, Button, Spin, Empty } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useComputers } from '../context/ComputerContext';
import { formatCurrency } from '../utils/pricing';
import dayjs from 'dayjs';

interface HistoryModalProps {
    visible: boolean;
    onCancel: () => void;
    computerId: string;
    computerName: string;
}

const { Text } = Typography;

export const HistoryModal: React.FC<HistoryModalProps> = ({ visible, onCancel, computerId, computerName }) => {
    const { getComputerHistory } = useComputers();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = React.useCallback(async () => {
        if (!visible || !computerId) return;
        setLoading(true);
        try {
            const data = await getComputerHistory(computerId);
            setHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    }, [visible, computerId, getComputerHistory]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const columns = [
        {
            title: 'Inicio',
            dataIndex: 'start_time',
            key: 'start_time',
            render: (ts: number) => dayjs(ts).format('HH:mm')
        },
        {
            title: 'Fin',
            dataIndex: 'actual_end_time',
            key: 'actual_end_time',
            render: (ts: number) => ts ? dayjs(ts).format('HH:mm') : <Text type="success">En curso</Text>
        },
        {
            title: 'Cliente',
            dataIndex: 'customer_name',
            key: 'customer_name',
        },
        {
            title: 'Modo',
            dataIndex: 'mode',
            key: 'mode',
            render: (mode: string) => mode === 'fixed' ? 'Fijo' : 'Libre'
        },
        {
            title: 'Precio',
            dataIndex: 'price',
            key: 'price',
            align: 'right' as const,
            render: (price: number) => <Text strong>{formatCurrency(price || 0)}</Text>
        }
    ];

    const totalRevenue = history.reduce((sum, item) => sum + (item.price || 0), 0);

    return (
        <Modal
            title={`Historial de Hoy: ${computerName}`}
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="close" onClick={onCancel}>Cerrar</Button>
            ]}
            width={600}
        >
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Reporte de sesiones iniciadas hoy.</Text>
                <Button icon={<ReloadOutlined />} onClick={fetchHistory} loading={loading}>Actualizar</Button>
            </div>

            {loading && !history.length ? (
                <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
            ) : (
                <>
                    <Table
                        dataSource={history}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        scroll={{ y: 300 }}
                    />
                    <div style={{ marginTop: 16, textAlign: 'right', fontSize: '16px' }}>
                        <Text>Total Generado (PCs): </Text>
                        <Text strong type="success">{formatCurrency(totalRevenue)}</Text>
                    </div>
                </>
            )}
        </Modal>
    );
};
