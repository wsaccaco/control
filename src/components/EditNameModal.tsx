import React, { useState, useEffect } from 'react';
import { Modal, Input } from 'antd';

interface EditNameModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: (name: string) => void;
    currentName: string;
    computerName: string;
}

export const EditNameModal: React.FC<EditNameModalProps> = ({ visible, onCancel, onConfirm, currentName, computerName }) => {
    const [name, setName] = useState(currentName);

    useEffect(() => {
        if (visible) {
            setName(currentName);
        }
    }, [visible, currentName]);

    return (
        <Modal
            title={`Editar Nombre - ${computerName}`}
            open={visible}
            onCancel={onCancel}
            onOk={() => onConfirm(name)}
            okText="Guardar"
            cancelText="Cancelar"
            destroyOnClose
        >
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del cliente"
                autoFocus
            />
        </Modal>
    );
};
