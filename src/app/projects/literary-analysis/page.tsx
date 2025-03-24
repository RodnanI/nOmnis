'use client';

import { useEffect, useState } from 'react';
import BackToLibrary from '@/components/projects/BackToLibrary';
import { motion } from 'framer-motion';
import LiteraryAnalysisContent from '@/components/projects/literary-analysis/LiteraryAnalysisContent';

export default function LiteraryAnalysisPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading for smooth transitions
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <BackToLibrary />

            {isLoading ? (
                <div className="flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <LiteraryAnalysisContent />
                </motion.div>
            )}
        </div>
    );
}