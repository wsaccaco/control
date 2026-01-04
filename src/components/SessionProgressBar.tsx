import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';

interface SessionProgressBarProps {
    startTime: number;
    endTime: number;
}

export const SessionProgressBar: React.FC<SessionProgressBarProps> = ({ startTime, endTime }) => {
    const [percent, setPercent] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const now = dayjs().valueOf();
            const total = endTime - startTime;
            const elapsed = now - startTime;

            if (total <= 0) {
                setPercent(100);
                return;
            }

            const p = Math.min(100, Math.max(0, (elapsed / total) * 100));
            setPercent(p);
        };

        updateProgress();
        const timer = setInterval(updateProgress, 1000);
        return () => clearInterval(timer);
    }, [startTime, endTime]);

    let color = '#52c41a'; // green
    if (percent > 80) color = '#faad14'; // yellow
    if (percent > 95) color = '#ff4d4f'; // red

    return (
        <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, margin: '4px 0', overflow: 'hidden' }}>
            <div
                style={{
                    width: `${percent}%`,
                    background: color,
                    height: '100%',
                    transition: 'width 1s linear, background-color 0.3s'
                }}
            />
        </div>
    );
};
