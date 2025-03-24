'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface UserMenuProps {
    user: {
        name?: string;
        username?: string;
        email?: string;
        image?: string | null;
    };
    onLogout?: () => void;
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const displayName = user.name || 'User';
    const displayEmail = user.email || user.username || '';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative z-50" ref={menuRef}>
            <motion.button
                className="flex items-center space-x-2 focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {user.image ? (
                    <Image
                        src={user.image}
                        alt={displayName}
                        width={40}
                        height={40}
                        className="rounded-full shadow-md"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-md">
                        <span className="text-white font-semibold">{displayName.charAt(0).toUpperCase()}</span>
                    </div>
                )}
                <span className="hidden md:inline text-foreground font-medium">{displayName}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </motion.button>

            {isOpen && (
                <motion.div
                    className="absolute right-0 mt-2 w-56 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-border shadow-xl overflow-hidden"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-medium truncate">{displayEmail}</p>
                    </div>

                    <div className="py-2">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                        >
                            <Link
                                href="/preferences"
                                className="flex items-center px-4 py-2 text-foreground hover:bg-primary/20 hover:text-primary transition-all rounded-md my-1 mx-2"
                                onClick={() => setIsOpen(false)}
                            >
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Preferences
                            </Link>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                        >
                            <Link
                                href="/statistics"
                                className="flex items-center px-4 py-2 text-foreground hover:bg-primary/20 hover:text-primary transition-all rounded-md my-1 mx-2"
                                onClick={() => setIsOpen(false)}
                            >
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Statistics
                            </Link>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                        >
                            <button
                                onClick={() => {
                                    if (onLogout) onLogout();
                                    setIsOpen(false);
                                }}
                                className="flex items-center w-full text-left px-4 py-2 text-foreground hover:bg-primary/20 hover:text-primary transition-all rounded-md my-1 mx-2"
                            >
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign out
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}