'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export default function BackToHomeButton() {
    return (
        <motion.div
            className="fixed top-4 left-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
        >
            <Link
                href="/"
                className="flex items-center gap-2 p-2 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-all duration-300 border border-white/10 shadow-md"
                title="Return to App Library"
            >
                <Home className="h-5 w-5" />
            </Link>
        </motion.div>
    );
}