import React, { useState } from 'react';
import { Modal, Select, Typography, message } from 'antd';
import { useComputers } from '../context/ComputerContext';

interface MoveSessionModalProps {
    visible: boolean;
    onCancel: () => void;
    sourceComputerId: string;
    sourceComputerName: string;
}

const { Text } = Typography;

export const MoveSessionModal: React.FC<MoveSessionModalProps> = ({ visible, onCancel, sourceComputerId, sourceComputerName }) => {
    const { computers, moveSession } = useComputers();
    const [targetId, setTargetId] = useState<string | null>(null);

    const availableComputers = computers.filter(c => c.status === 'available' && c.id !== sourceComputerId);

    const handleOk = () => {
        if (!targetId) {
            message.error("Por favor selecciona una computadora destino");
            return;
        }
        moveSession(sourceComputerId, targetId);
        message.success(`Sesión movida de ${sourceComputerName} a la nueva PC`);
        setTargetId(null);
        onCancel();
    };

    return (
        <Modal
            title={`Mover Sesión de ${sourceComputerName}`}
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            okText="Mover"
            cancelText="Cancelar"
        >
            <div className="flex flex-col gap-4">
                <Text>Selecciona la computadora destino:</Text>
                <Select
                    style={{ width: '100%' }}
                    placeholder="Seleccionar PC Disponible"
                    onChange={setTargetId}
                    value={targetId}
                    options={availableComputers.map(pc => ({ label: pc.name, value: pc.id }))}
                />
                {availableComputers.length === 0 && (
                    <Text type="danger">No hay computadoras disponibles.</Text>
                )}
            </div>
        </Modal>
    );
};
