'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';

export default function PreferencesPage() {
    const { theme, setTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                } else {
                    // Redirect to login if not authenticated
                    router.push('/login');
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Error checking authentication:', err);
                setIsLoading(false);
            });
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect to login via the useEffect
    }

    const themeOptions = [
        { value: 'light', label: 'Light', icon: '☀️' },
        { value: 'dark', label: 'Dark', icon: '🌙' },
        { value: 'system', label: 'System', icon: '🖥️' },
    ];

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold mb-8">User Preferences</h1>

                <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-6">Theme Settings</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {themeOptions.map((option) => (
                            <motion.div
                                key={option.value}
                                className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                                    theme === option.value
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/30'
                                }`}
                                onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center">
                                    <span className="text-2xl mr-3">{option.icon}</span>
                                    <div>
                                        <p className="font-medium">{option.label}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {option.value === 'system'
                                                ? 'Follow system preference'
                                                : `Use ${option.label.toLowerCase()} theme`}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Additional preference sections can be added here in the future */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <h2 className="text-2xl font-semibold mb-6">Account Information</h2>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Username</p>
                            <p className="font-medium">{user.username}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{user.name}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{user.email}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Role</p>
                            <p className="font-medium capitalize">{user.role}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}