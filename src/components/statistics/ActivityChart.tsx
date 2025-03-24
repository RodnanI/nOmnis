'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface ActivityChartProps {
    data: Array<{
        name: string;
        date: string;
        hours: number;
        tasks: number;
    }>;
}

export default function ActivityChart({ data }: ActivityChartProps) {
    const [chartType, setChartType] = useState<'line' | 'area'>('area');
    
    // Ensure we have data to display
    const chartData = data.length > 0 
        ? data 
        : generateDummyData();
        
    // Generate dummy data if needed
    function generateDummyData() {
        const result = [];
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        for (let i = 0; i < 14; i++) {
            const dayIndex = i % 7;
            const dayName = days[dayIndex];
            const date = `${Math.floor(i / 7) + 1}/${dayIndex + 1}`;
            
            result.push({
                name: dayName,
                date: date,
                hours: Math.random() * 3 + 0.5, // 0.5 to 3.5 hours
                tasks: Math.floor(Math.random() * 5) // 0 to 4 tasks
            });
        }
        
        return result;
    }
    
    return (
        <div className="h-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setChartType('area')}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            chartType === 'area' 
                                ? 'bg-primary text-white' 
                                : 'bg-secondary hover:bg-secondary-hover'
                        }`}
                    >
                        Area
                    </button>
                    <button
                        onClick={() => setChartType('line')}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            chartType === 'line' 
                                ? 'bg-primary text-white' 
                                : 'bg-secondary hover:bg-secondary-hover'
                        }`}
                    >
                        Line
                    </button>
                </div>
            </div>
            
            <motion.div 
                key={chartType}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-60 mt-4"
            >
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }} 
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                                yAxisId="left" 
                                tick={{ fontSize: 12 }} 
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                tick={{ fontSize: 12 }} 
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                                    borderColor: 'rgba(100, 116, 139, 0.3)',
                                    borderRadius: '8px',
                                    color: '#f3f4f6'
                                }} 
                                formatter={(value: number, name: string) => {
                                    if (name === 'hours') return [`${value.toFixed(1)} hours`, 'Time Spent'];
                                    if (name === 'tasks') return [`${value} tasks`, 'Tasks Completed'];
                                    return [value, name];
                                }}
                            />
                            <Legend />
                            <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="hours" 
                                name="Time Spent"
                                stroke="#3b82f6" 
                                activeDot={{ r: 8 }} 
                                strokeWidth={2}
                                dot={{ strokeWidth: 2 }}
                            />
                            <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="tasks" 
                                name="Tasks" 
                                stroke="#8b5cf6" 
                                strokeWidth={2}
                                dot={{ strokeWidth: 2 }}
                            />
                        </LineChart>
                    ) : (
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }} 
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                                tick={{ fontSize: 12 }} 
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                                    borderColor: 'rgba(100, 116, 139, 0.3)',
                                    borderRadius: '8px',
                                    color: '#f3f4f6'
                                }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'hours') return [`${value.toFixed(1)} hours`, 'Time Spent'];
                                    if (name === 'tasks') return [`${value} tasks`, 'Tasks Completed'];
                                    return [value, name];
                                }}
                            />
                            <Legend />
                            <Area 
                                type="monotone" 
                                dataKey="hours" 
                                name="Time Spent"
                                stackId="1"
                                stroke="#3b82f6" 
                                fill="#3b82f6" 
                                fillOpacity={0.5}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="tasks" 
                                name="Tasks"
                                stackId="2"
                                stroke="#8b5cf6" 
                                fill="#8b5cf6" 
                                fillOpacity={0.5}
                            />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </motion.div>
        </div>
    );
}