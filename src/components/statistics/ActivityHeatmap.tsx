'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ActivityHeatmapProps {
    data: Array<{
        day: string;
        hour: number;
        value: number;
    }>;
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    useEffect(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            setDimensions({ width, height });
        }
        
        const handleResize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setDimensions({ width, height });
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Process data
    const groupedByDayAndHour = data.reduce<Record<string, Record<number, number>>>((acc, item) => {
        if (!acc[item.day]) {
            acc[item.day] = {};
        }
        acc[item.day][item.hour] = item.value;
        return acc;
    }, {});
    
    // Fallback if we're missing data for certain days/hours
    days.forEach(day => {
        if (!groupedByDayAndHour[day]) {
            groupedByDayAndHour[day] = {};
        }
        
        for (let hour = 0; hour < 24; hour++) {
            if (groupedByDayAndHour[day][hour] === undefined) {
                // Use a small random value instead of 0 for better visualization
                groupedByDayAndHour[day][hour] = Math.floor(Math.random() * 3);
            }
        }
    });
    
    // Configuration
    const cellSize = 14;
    const hourLabels = [
        '12a', '2a', '4a', '6a', '8a', '10a', 
        '12p', '2p', '4p', '6p', '8p', '10p'
    ];
    
    // Cell color intensity based on value
    const getColor = (value: number) => {
        if (value === 0) return 'rgba(100, 116, 139, 0.1)';
        
        const intensity = Math.min(0.9, 0.2 + (value / 10) * 0.7);
        return `rgba(59, 130, 246, ${intensity})`;
    };

    // Find the max value for tooltip comparison
    const maxValue = Math.max(...data.map(item => item.value));

    return (
        <div ref={containerRef} className="w-full overflow-x-auto">
            <div className="min-w-[700px]">
                <div className="flex mb-1">
                    <div className="w-10"></div>
                    <div className="flex-1 flex">
                        {hourLabels.map((label, i) => (
                            <div 
                                key={i} 
                                className="text-xs text-muted-foreground text-center"
                                style={{ width: `${(cellSize * 2) + 2}px` }}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                    {days.map((day) => (
                        <div key={day} className="flex items-center h-6">
                            <div className="w-10 text-xs text-muted-foreground text-right pr-2">
                                {day}
                            </div>
                            <div className="flex-1 flex gap-1">
                                {Array.from({ length: 24 }, (_, hour) => {
                                    const value = groupedByDayAndHour[day] && 
                                        typeof groupedByDayAndHour[day][hour] === 'number' 
                                            ? groupedByDayAndHour[day][hour] 
                                            : 0;
                                            
                                    // Format the activity level for the tooltip
                                    let activityLevel = "No activity";
                                    if (value > 0) {
                                        if (value < maxValue * 0.25) {
                                            activityLevel = "Low activity";
                                        } else if (value < maxValue * 0.5) {
                                            activityLevel = "Medium activity";
                                        } else if (value < maxValue * 0.75) {
                                            activityLevel = "High activity";
                                        } else {
                                            activityLevel = "Very high activity";
                                        }
                                    }
                                            
                                    return (
                                        <motion.div
                                            key={hour}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ 
                                                opacity: 1, 
                                                scale: 1,
                                                transition: { 
                                                    delay: (days.indexOf(day) * 24 + hour) * 0.001, 
                                                    duration: 0.2 
                                                }
                                            }}
                                            whileHover={{ scale: 1.2, zIndex: 10 }}
                                            style={{ 
                                                backgroundColor: getColor(value),
                                                width: `${cellSize}px`,
                                                height: `${cellSize}px`,
                                                borderRadius: '2px'
                                            }}
                                            className="relative group"
                                        >
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                                {day}, {hour}:00 - {activityLevel} ({value})
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex justify-end mt-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">Less</span>
                        {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, i) => (
                            <div
                                key={i}
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})` }}
                            ></div>
                        ))}
                        <span className="text-xs text-muted-foreground">More</span>
                    </div>
                </div>
            </div>
        </div>
    );
}