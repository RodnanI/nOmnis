'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useStatistics } from '@/hooks/useStatistics';
import StatisticsPanel from '@/components/statistics/StatisticsPanel';

export default function StatisticsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { statistics, isLoading, error, refreshStatistics } = useStatistics();
    const [hasRefreshed, setHasRefreshed] = useState(false);
    
    // Handle refresh with debounce to prevent multiple calls
    const handleRefresh = useCallback(() => {
        refreshStatistics();
        setHasRefreshed(true);
    }, [refreshStatistics]);

    useEffect(() => {
        // If not logged in, redirect to login
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);
    
    // Automatically refresh once when page loads
    useEffect(() => {
        if (status === 'authenticated' && !hasRefreshed) {
            handleRefresh();
        }
    }, [status, hasRefreshed, handleRefresh]);

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // If not authenticated, don't render anything (redirect will happen)
    if (status !== 'authenticated') {
        return null;
    }

    // No need to convert minutes to hours here - it's already done in the useStatistics hook

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Your Statistics</h1>
                    <motion.button 
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Refresh Data
                    </motion.button>
                </div>

                {error ? (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
                        <p>{error}</p>
                    </div>
                ) : (
                    <StatisticsPanel 
                        statistics={statistics}
                        onRefresh={handleRefresh}
                    />
                )}
            </motion.div>
        </div>
    );
}