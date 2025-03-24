'use client';

import { motion } from 'framer-motion';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts';

interface ProjectUsageProps {
    data: Array<{
        name: string;
        usage: number;
    }>;
}

export default function ProjectUsage({ data }: ProjectUsageProps) {
    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];
    
    // Ensure we have data to display
    const chartData = data.length > 0 
        ? data 
        : [
            { name: 'File Uploader', usage: 40 },
            { name: 'Chat Assistant', usage: 35 },
            { name: 'Literary Analysis', usage: 25 }
        ];
        
    // Normalize data percentages to ensure they sum to 100
    const totalUsage = chartData.reduce((sum, item) => sum + item.usage, 0);
    const normalizedData = chartData.map(item => ({
        name: item.name,
        usage: totalUsage > 0 ? Math.round((item.usage / totalUsage) * 100) : 33
    }));
    
    const renderCustomizedLabel = ({ 
        cx, 
        cy, 
        midAngle, 
        innerRadius, 
        outerRadius, 
        percent 
    }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor={x > cx ? 'start' : 'end'} 
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-60"
        >
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={normalizedData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="usage"
                    >
                        {normalizedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'Usage']}
                        contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                            borderColor: 'rgba(100, 116, 139, 0.3)',
                            borderRadius: '8px',
                            color: '#f3f4f6'
                        }}
                    />
                    <Legend 
                        formatter={(value, entry, index) => {
                            return <span className="text-theme">{value}</span>;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </motion.div>
    );
}