import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Button, Typography, Space, AutoComplete } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useComputers } from '../context/ComputerContext';

interface AddExtraModalProps {
    visible: boolean;
    onCancel: () => void;
    computerId: string;
    computerName: string;
}

const { Text } = Typography;

export const AddExtraModal: React.FC<AddExtraModalProps> = ({ visible, onCancel, computerId, computerName }) => {
    const { addExtra } = useComputers();
    const [form] = Form.useForm();

    const handleOk = () => {
        form.validateFields().then(values => {
            addExtra(computerId, values.name, values.price);
            form.resetFields();
            onCancel();
        });
    };

    return (
        <Modal
            title={`Agregar Extra - ${computerName}`}
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            okText="Agregar"
            cancelText="Cancelar"
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Descripción"
                    name="name"
                    rules={[{ required: true, message: 'Ingresa el nombre del producto o servicio' }]}
                >
                    <AutoComplete
                        options={[
                            { value: 'Gaseosa' },
                            { value: 'Galleta' },
                            { value: 'Pai de Limón' },
                            { value: 'Impresión' },
                            { value: 'Caramelo' },
                            { value: 'Chupetín' },
                            { value: 'Agua' },
                            { value: 'Snack' }
                        ]}
                        placeholder="Ej. Gaseosa, Chocolate, Impresión..."
                        filterOption={(inputValue, option) =>
                            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                        }
                        autoFocus
                    />
                </Form.Item>
                <Form.Item
                    label="Precio (S/)"
                    name="price"
                    rules={[{ required: true, message: 'Ingresa el precio' }]}
                    initialValue={0.50}
                >
                    <InputNumber min={0.10} step={0.10} style={{ width: '100%' }} />
                </Form.Item>
                <Space wrap style={{ marginBottom: 16 }}>
                    {[0.50, 1.00, 1.50, 2.00, 3.00, 5.00].map(price => (
                        <Button
                            key={price}
                            size="small"
                            onClick={() => form.setFieldsValue({ price })}
                        >
                            S/ {price.toFixed(2)}
                        </Button>
                    ))}
                </Space>
            </Form>
        </Modal>
    );
};
