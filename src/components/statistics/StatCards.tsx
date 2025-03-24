'use client';

import { motion } from 'framer-motion';
import { 
    FolderOpen, 
    Clock, 
    CheckSquare, 
    FileUp
} from 'lucide-react';

interface StatCardsProps {
    projects: number;
    hours: number;
    tasks: number;
    files: number;
}

export default function StatCards({ projects, hours, tasks, files }: StatCardsProps) {
    // Ensure we always have positive numbers
    const safeProjects = Math.max(0, projects || 0);
    const safeHours = Math.max(0, hours || 0);
    const safeTasks = Math.max(0, tasks || 0);
    const safeFiles = Math.max(0, files || 0);
    
    const stats = [
        { 
            label: 'Projects Accessed', 
            value: safeProjects, 
            icon: FolderOpen, 
            color: 'bg-blue-500', 
            lightColor: 'bg-blue-100 dark:bg-blue-900/30',
            textColor: 'text-blue-500 dark:text-blue-400'
        },
        { 
            label: 'Hours Spent', 
            value: safeHours, 
            icon: Clock, 
            color: 'bg-purple-500', 
            lightColor: 'bg-purple-100 dark:bg-purple-900/30',
            textColor: 'text-purple-500 dark:text-purple-400',
            isDecimal: true
        },
        { 
            label: 'Completed Tasks', 
            value: safeTasks, 
            icon: CheckSquare, 
            color: 'bg-green-500', 
            lightColor: 'bg-green-100 dark:bg-green-900/30',
            textColor: 'text-green-500 dark:text-green-400'
        },
        { 
            label: 'Files Uploaded', 
            value: safeFiles, 
            icon: FileUp, 
            color: 'bg-amber-500', 
            lightColor: 'bg-amber-100 dark:bg-amber-900/30',
            textColor: 'text-amber-500 dark:text-amber-400'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                const displayValue = stat.isDecimal ? stat.value.toFixed(1) : stat.value;
                
                return (
                    <motion.div
                        key={stat.label}
                        className="bg-card rounded-xl shadow-sm border border-border overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-lg ${stat.lightColor}`}>
                                    <Icon className={`h-6 w-6 ${stat.textColor}`} />
                                </div>
                                <span className={`text-4xl font-bold ${stat.textColor}`}>
                                    {displayValue}
                                </span>
                            </div>
                            <h3 className="mt-6 text-base font-medium text-muted-foreground">
                                {stat.label}
                            </h3>
                        </div>
                        <div className={`h-1 w-full ${stat.color}`}></div>
                    </motion.div>
                );
            })}
        </div>
    );
}