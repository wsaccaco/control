import React, { useState } from 'react';
import { Modal, Radio, Space } from 'antd';
import { useSettings } from '../context/SettingsContext';

interface AssignZoneModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: (zoneId: string) => void;
    currentZoneId?: string;
    computerName: string;
}

export const AssignZoneModal: React.FC<AssignZoneModalProps> = ({ visible, onCancel, onConfirm, currentZoneId, computerName }) => {
    const { zones } = useSettings();
    const [selectedZone, setSelectedZone] = useState<string>(currentZoneId || (zones.find(z => z.isDefault)?.id || zones[0]?.id));

    const handleOk = () => {
        onConfirm(selectedZone);
    };

    return (
        <Modal
            title={`Asignar Zona - ${computerName}`}
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            okText="Asignar"
            cancelText="Cancelar"
        >
            <p>Selecciona la zona de precios para esta computadora:</p>
            <Radio.Group onChange={(e) => setSelectedZone(e.target.value)} value={selectedZone}>
                <Space direction="vertical">
                    {zones.map(zone => (
                        <Radio key={zone.id} value={zone.id}>
                            {zone.name} {zone.isDefault && <span style={{ fontSize: '10px', color: '#8c8c8c' }}>(Por Defecto)</span>}
                        </Radio>
                    ))}
                </Space>
            </Radio.Group>
        </Modal>
    );
};
