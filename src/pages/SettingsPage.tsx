
import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Table, Typography, message, Card, Tabs, Flex, Tooltip, Space, Radio } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined, ArrowLeftOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useSettings } from '../context/SettingsContext';
import type { PriceRule } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

export const SettingsPage: React.FC = () => {
    const { pcCount, setPcCount, zones, setZones, updateGeneralSettings, generalSettings, currencySymbol } = useSettings();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [activeZoneId, setActiveZoneId] = useState<string>('default');

    // Local state for zones to allow cancellation
    const [localZones, setLocalZones] = useState<any[]>([]);

    useEffect(() => {
        setLocalZones(zones);
        form.setFieldsValue({
            pcCount,
            name: generalSettings?.lan_center_name || '',
            currency: generalSettings?.currency_symbol || 'S/',
            pricing_strategy: generalSettings?.pricing_strategy || 'cumulative'
        });
        if (zones.length > 0 && !zones.find(z => z.id === activeZoneId)) {
            setActiveZoneId(zones[0].id);
        }
    }, [zones, pcCount, generalSettings, form]);

    const handleSave = () => {
        form.validateFields().then(values => {
            setPcCount(values.pcCount);
            setZones(localZones);
            updateGeneralSettings({
                lan_center_name: values.name,
                currency_symbol: values.currency,
                pricing_strategy: values.pricing_strategy,
                zones: localZones
            });
            message.success('Configuración guardada correctamente');
        }).catch(() => {
            message.error('Por favor revisa los campos');
        });
    };

    const handleAddRule = (zoneId: string) => {
        const newZones = localZones.map(z => {
            if (z.id === zoneId) {
                return { ...z, rules: [...z.rules, { minutes: 15, price: 0.50 }] };
            }
            return z;
        });
        setLocalZones(newZones);
    };

    const handleDeleteRule = (zoneId: string, ruleIndex: number) => {
        const newZones = localZones.map(z => {
            if (z.id === zoneId) {
                const newRules = [...z.rules];
                newRules.splice(ruleIndex, 1);
                return { ...z, rules: newRules };
            }
            return z;
        });
        setLocalZones(newZones);
    };

    const handleRuleChange = (zoneId: string, ruleIndex: number, field: string, value: number) => {
        const newZones = localZones.map(z => {
            if (z.id === zoneId) {
                const newRules = [...z.rules];
                newRules[ruleIndex] = { ...newRules[ruleIndex], [field]: value };
                return { ...z, rules: newRules };
            }
            return z;
        });
        setLocalZones(newZones);
    };

    const handleZoneChange = (zoneId: string, field: string, value: any) => {
        const newZones = localZones.map(z => {
            if (z.id === zoneId) {
                return { ...z, [field]: value };
            }
            return z;
        });
        setLocalZones(newZones);
    };

    const handleAddZone = () => {
        const newId = 'zone_' + Date.now();
        setLocalZones([...localZones, {
            id: newId,
            name: 'Nueva Zona',
            tolerance: 5,
            rules: [{ minutes: 60, price: 1.00 }],
            isDefault: false
        }]);
        setActiveZoneId(newId);
    };

    const handleDeleteZone = (zoneId: string) => {
        if (localZones.length <= 1) {
            message.error("Debe haber al menos una zona");
            return;
        }
        setLocalZones(localZones.filter(z => z.id !== zoneId));
        setActiveZoneId(localZones[0].id);
    };

    const columns = (zoneId: string) => [
        {
            title: 'Tiempo (Minutos)',
            dataIndex: 'minutes',
            key: 'minutes',
            render: (text: number, _: any, index: number) => (
                <InputNumber
                    min={1}
                    value={text}
                    onChange={(val) => handleRuleChange(zoneId, index, 'minutes', val || 0)}
                />
            ),
        },
        {
            title: 'Precio (' + currencySymbol + ')',
            dataIndex: 'price',
            key: 'price',
            render: (text: number, _: any, index: number) => (
                <InputNumber
                    min={0}
                    step={0.10}
                    value={text}
                    onChange={(val) => handleRuleChange(zoneId, index, 'price', val || 0)}
                />
            ),
        },
        {
            title: 'Acciones',
            key: 'action',
            render: (_: any, __: any, index: number) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteRule(zoneId, index)} />
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ marginBottom: 16 }}>Volver al Panel</Button>

            <Flex gap="middle" vertical>
                <Card title="Configuración General">
                    <Form form={form} layout="vertical">
                        <Flex gap="large">
                            <Form.Item label="Nombre del Lan Center" name="name" rules={[{ required: true }]} style={{ flex: 1 }}>
                                <Input placeholder="Ej: Matrix Gaming" />
                            </Form.Item>
                            <Form.Item label="Símbolo de Moneda" name="currency" rules={[{ required: true, message: 'Ingresa el símbolo' }]} style={{ width: 100 }}>
                                <Input placeholder="S/" />
                            </Form.Item>
                            <Form.Item label="Cantidad de PCs" name="pcCount" rules={[{ required: true }]} style={{ width: 100 }}>
                                <InputNumber min={1} max={100} />
                            </Form.Item>
                        </Flex>
                        <Form.Item
                            name="pricing_strategy"
                            label={
                                <Space>
                                    Estrategia de Cobro (Añadir Tiempo)
                                    <Tooltip title={
                                        <div>
                                            <p><b>Acumulativo:</b> Cobra estrictamente el valor del tiempo agregado. (Ej. 1h [S/2] + 1h [S/2] = S/4 total)</p>
                                            <p><b>Mejor Precio:</b> Recalcula todo el tiempo acumulado como una sola sesión. (Ej. 1h + 1h = 2h [S/3 total])</p>
                                        </div>
                                    }>
                                        <QuestionCircleOutlined />
                                    </Tooltip>
                                </Space>
                            }
                        >
                            <Radio.Group>
                                <Space direction="vertical">
                                    <Radio value="cumulative">
                                        <b>Estricto / Acumulativo</b>
                                        <div style={{ fontSize: '12px', color: '#8c8c8c', marginLeft: 24 }}>
                                            Suma el costo del nuevo tiempo sin modificar lo anterior.
                                        </div>
                                    </Radio>
                                    <Radio value="recalculate">
                                        <b>Mejor Precio (Promoción)</b>
                                        <div style={{ fontSize: '12px', color: '#8c8c8c', marginLeft: 24 }}>
                                            Ajusta el total a la tarifa de la duración acumulada.
                                        </div>
                                    </Radio>
                                </Space>
                            </Radio.Group>
                        </Form.Item>
                    </Form>
                </Card>

                <Card
                    title="Gestión de Tarifas y Zonas"
                    extra={<Button type="dashed" icon={<PlusOutlined />} onClick={handleAddZone}>Nueva Zona</Button>}
                >
                    <Tabs
                        activeKey={activeZoneId}
                        onChange={setActiveZoneId}
                        type="card"
                        items={localZones.map((zone) => ({
                            key: zone.id,
                            label: zone.name,
                            children: (
                                <div style={{ padding: '10px 0' }}>
                                    <Flex gap="large" align="center" style={{ marginBottom: 16, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid #424242', padding: 16, borderRadius: 8 }}>
                                        <div style={{ flex: 1 }}>
                                            <Typography.Text strong>Nombre de Zona:</Typography.Text>
                                            <Input
                                                value={zone.name}
                                                onChange={e => handleZoneChange(zone.id, 'name', e.target.value)}
                                                style={{ marginLeft: 8, width: 200 }}
                                            />
                                        </div>
                                        <div>
                                            <Typography.Text strong>Tolerancia (min):</Typography.Text>
                                            <Tooltip title="Tiempo extra permitido sin cobrar el siguiente bloque">
                                                <InputNumber
                                                    value={zone.tolerance}
                                                    onChange={val => handleZoneChange(zone.id, 'tolerance', val || 0)}
                                                    style={{ marginLeft: 8, width: 80 }}
                                                />
                                            </Tooltip>
                                        </div>
                                        {!zone.isDefault && (
                                            <Button danger onClick={() => handleDeleteZone(zone.id)}>Eliminar Zona</Button>
                                        )}
                                    </Flex>

                                    <Table
                                        dataSource={zone.rules.map((r: any, i: number) => ({ ...r, key: i }))}
                                        columns={columns(zone.id)}
                                        pagination={false}
                                        footer={() => (
                                            <Button type="dashed" onClick={() => handleAddRule(zone.id)} block icon={<PlusOutlined />}>
                                                Agregar Regla de Precio
                                            </Button>
                                        )}
                                    />
                                    <div style={{ marginTop: 10 }}>
                                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                            * El sistema calculará automáticamente el mejor precio combinando estas reglas.
                                            Si existe una regla exacta o mayor que sea más barata que la suma de partes, se aplicará esa.
                                        </Typography.Text>
                                    </div>
                                </div>
                            )
                        }))}
                    />
                </Card>

                <div style={{ textAlign: 'right' }}>
                    <Button type="primary" icon={<SaveOutlined />} size="large" onClick={handleSave}>
                        Guardar Toda la Configuración
                    </Button>
                </div>
            </Flex>
        </div>
    );
};
