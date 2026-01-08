import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Table, Typography, message, Card } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useSettings } from '../context/SettingsContext';
import type { PriceRule } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

export const SettingsPage: React.FC = () => {
    const { pcCount, setPcCount, priceRules, setPriceRules, currencySymbol, generalSettings, updateGeneralSettings } = useSettings();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // Local state for table editing
    const [localRules, setLocalRules] = useState<PriceRule[]>([]);

    useEffect(() => {
        setLocalRules(priceRules);
        form.setFieldsValue({
            pcCount,
            name: generalSettings?.lan_center_name || '',
            currency: generalSettings?.currency_symbol || 'S/'
        });
    }, [priceRules, pcCount, generalSettings, form]);

    const handleSave = () => {
        form.validateFields().then(values => {
            setPcCount(values.pcCount);
            setPriceRules(localRules);
            updateGeneralSettings({
                lan_center_name: values.name,
                currency_symbol: values.currency
            });
            message.success('Configuración guardada correctamente');
        }).catch(() => {
            message.error('Por favor revisa los campos');
        });
    };

    const handleDeleteRule = (index: number) => {
        const newRules = [...localRules];
        newRules.splice(index, 1);
        setLocalRules(newRules);
    };

    const handleAddRule = () => {
        setLocalRules([...localRules, { minutes: 15, price: 0.50 }]);
    };

    const handleRuleChange = (index: number, field: keyof PriceRule, value: number) => {
        const newRules = [...localRules];
        newRules[index] = { ...newRules[index], [field]: value };
        setLocalRules(newRules);
    };

    const columns = [
        {
            title: 'Minutos',
            dataIndex: 'minutes',
            key: 'minutes',
            render: (text: number, _: PriceRule, index: number) => (
                <InputNumber
                    min={1}
                    value={text}
                    onChange={(val) => handleRuleChange(index, 'minutes', val || 0)}
                />
            ),
        },
        {
            title: `Precio (${currencySymbol})`,
            dataIndex: 'price',
            key: 'price',
            render: (text: number, _: PriceRule, index: number) => (
                <InputNumber
                    min={0}
                    step={0.10}
                    value={text}
                    onChange={(val) => handleRuleChange(index, 'price', val || 0)}
                />
            ),
        },
        {
            title: 'Acciones',
            key: 'action',
            render: (_: any, __: any, index: number) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteRule(index)} />
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ marginBottom: 16 }}>Volver al Panel</Button>

            <Card title="Configuración General">
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Nombre del Lan Center"
                        name="name"
                        rules={[{ required: true, message: 'Ingresa el nombre' }]}
                    >
                        <Input placeholder="Ej: Matrix Gaming" />
                    </Form.Item>

                    <Form.Item
                        label="Símbolo de Moneda"
                        name="currency"
                        rules={[{ required: true, message: 'Ingresa el símbolo' }]}
                    >
                        <Input placeholder="S/" />
                    </Form.Item>

                    <Form.Item
                        label="Cantidad de Computadoras"
                        name="pcCount"
                        rules={[{ required: true, message: 'Ingresa la cantidad' }]}
                    >
                        <InputNumber min={1} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Card>

            <Card title="Reglas de Precios" style={{ marginTop: 24 }} extra={<Button icon={<PlusOutlined />} onClick={handleAddRule}>Agregar Regla</Button>}>
                <Table
                    dataSource={localRules.map((r, i) => ({ ...r, key: i }))}
                    columns={columns}
                    pagination={false}
                />
                <div style={{ marginTop: 16 }}>
                    <Text type="secondary">
                        Nota: El precio se calculará buscando la regla exacta. Si no existe, se sumarán las reglas más pequeñas.
                    </Text>
                </div>
            </Card>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
                <Button type="primary" icon={<SaveOutlined />} size="large" onClick={handleSave}>
                    Guardar Cambios
                </Button>
            </div>
        </div>
    );
};
