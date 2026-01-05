import React, { useEffect, useState } from 'react';
import { Card, Typography, Flex, Tag } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import type { Computer } from '../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);

const { Text } = Typography;

export const NextToFinishList: React.FC<{ computers: Computer[] }> = ({ computers }) => {
    const [sorted, setSorted] = useState<Computer[]>([]);
    const [now, setNow] = useState(dayjs());

    // Update "now" every minute to refresh relative times
    useEffect(() => {
        const interval = setInterval(() => setNow(dayjs()), 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const activeFixed = computers.filter(c =>
            c.status === 'occupied' &&
            c.mode === 'fixed' &&
            c.endTime
        );

        // Sort by end time (soonest first)
        activeFixed.sort((a, b) => (a.endTime || 0) - (b.endTime || 0));

        setSorted(activeFixed.slice(0, 5));
    }, [computers, now]);

    if (sorted.length === 0) return null;

    return (
        <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: 8, display: 'block' }}>PRÓXIMOS A FINALIZAR</Text>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {sorted.map(pc => {
                    const endTime = dayjs(pc.endTime);
                    const diffMinutes = endTime.diff(now, 'minute');
                    const isUrgent = diffMinutes < 5;
                    const isOverdue = diffMinutes < 0;

                    let timeText = '';
                    if (isOverdue) {
                        timeText = 'Vencido';
                    } else if (diffMinutes === 0) {
                        timeText = '< 1 min';
                    } else {
                        timeText = `${diffMinutes} min`;
                    }

                    return (
                        <Card
                            key={pc.id}
                            size="small"
                            style={{
                                minWidth: 140, // Wider for better readability
                                flexShrink: 0,
                                backgroundColor: isOverdue ? '#fff1f0' : isUrgent ? '#fffbe6' : '#f6ffed',
                                borderColor: isOverdue ? '#ffccc7' : isUrgent ? '#ffe58f' : '#b7eb8f'
                            }}
                            styles={{ body: { padding: '10px' } }}
                        >
                            {/* PC Name Section - Big and Bold */}
                            <Flex align="center" justify='space-between' style={{ marginBottom: 6 }}>
                                <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold', padding: '4px 8px', margin: 0 }}>
                                    {pc.name}
                                </Tag>
                            </Flex>

                            {/* Time Section */}
                            <Flex align="center" gap="small">
                                <ClockCircleOutlined style={{ fontSize: '16px', color: isOverdue ? '#cf1322' : isUrgent ? '#d48806' : '#389e0d' }} />
                                <Text style={{ fontSize: '16px', fontWeight: 'bold', color: isOverdue ? '#cf1322' : isUrgent ? '#d48806' : '#389e0d' }}>
                                    {timeText}
                                </Text>
                            </Flex>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
