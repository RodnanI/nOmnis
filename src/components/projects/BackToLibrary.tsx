'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function BackToLibrary() {
    return (
        <motion.div
            className="fixed top-4 left-4 z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-black/30 backdrop-blur-md text-white rounded-full hover:bg-black/50 transition-all duration-300"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                </svg>
                <span>App Library</span>
            </Link>
        </motion.div>
    );
}