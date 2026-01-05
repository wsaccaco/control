import React, { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

interface TimerDisplayProps {
    endTime?: number;
    startTime?: number; // Added startTime for count-up
    mode?: 'fixed' | 'open';
    onExpire?: () => void;
    viewMode?: 'remaining' | 'elapsed';
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ endTime, startTime, mode = 'fixed', onExpire, viewMode = 'remaining' }) => {
    const [displayTime, setDisplayTime] = useState<string>('--:--');
    const [isExpired, setIsExpired] = useState(false);
    const hasVibratedRef = useRef(false);

    useEffect(() => {
        // Reset vibration flag if active session ends or changes
        if (!endTime && !startTime) {
            hasVibratedRef.current = false;
        }
    }, [endTime, startTime]);

    useEffect(() => {
        // If no running session
        if ((mode === 'fixed' && !endTime) || (mode === 'open' && !startTime)) {
            setDisplayTime('--:--');
            setIsExpired(false);
            return;
        }

        const updateTimer = () => {
            const now = dayjs();

            if (mode === 'fixed' && endTime && startTime) {
                const end = dayjs(endTime);

                if (viewMode === 'elapsed') {
                    // Show total time connected (now - start)
                    const start = dayjs(startTime);
                    const diff = now.diff(start);
                    const dur = dayjs.duration(diff);
                    const hours = Math.floor(dur.asHours());
                    const mins = dur.minutes();
                    const secs = dur.seconds();
                    setDisplayTime(`${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);

                    // Check expiration for color/redness logic only
                    if (now.isAfter(end)) {
                        setIsExpired(true);
                        if (!hasVibratedRef.current && navigator.vibrate) {
                            navigator.vibrate([500, 200, 500]); // Vibrate pattern
                            hasVibratedRef.current = true;
                        }
                    } else {
                        setIsExpired(false);
                    }
                    return;
                }

                // Remaining Mode logic
                const diff = end.diff(now);

                if (diff <= 0) {
                    setIsExpired(true);

                    if (!hasVibratedRef.current) {
                        if (navigator.vibrate) {
                            navigator.vibrate([500, 200, 500]); // Vibrate pattern
                        }
                        hasVibratedRef.current = true;
                    }

                    const overtime = now.diff(end);
                    const dur = dayjs.duration(overtime);
                    const hours = Math.floor(dur.asHours());
                    const mins = dur.minutes();
                    const secs = dur.seconds();
                    setDisplayTime(`Hace ${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
                } else {
                    setIsExpired(false);
                    // Reset vibration if for some reason time was added and we are back to positive
                    if (diff > 0) {
                        hasVibratedRef.current = false;
                    }

                    const dur = dayjs.duration(diff);
                    const hours = Math.floor(dur.asHours());
                    const mins = dur.minutes();
                    const secs = dur.seconds();
                    setDisplayTime(`${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
                }
            } else if (mode === 'open' && startTime) {
                const start = dayjs(startTime);
                const diff = now.diff(start);
                const dur = dayjs.duration(diff);
                const hours = Math.floor(dur.asHours());
                const mins = dur.minutes();
                const secs = dur.seconds();
                setDisplayTime(`${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
            }
        };

        updateTimer(); // Initial call
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [endTime, startTime, mode, onExpire, viewMode]);

    return (
        <div
            style={{
                fontSize: '24px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                color: isExpired && mode === 'fixed' ? '#ff4d4f' : mode === 'open' ? '#1890ff' : 'inherit',
                animation: isExpired && mode === 'fixed' ? 'pulse 1s infinite' : 'none',
                textAlign: 'center'
            }}
        >
            {displayTime}
        </div>
    );
};
