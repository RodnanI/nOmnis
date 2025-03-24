'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Project } from '@/types';
import ProjectContainer from '@/components/projects/ProjectContainer';

export default function HomePage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null); // Add missing user state
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        // Check if user is logged in
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                }
            })
            .catch(err => {
                console.error('Error checking authentication:', err);
            });

        // Fetch projects
        fetch('/api/projects')
            .then(response => response.json())
            .then(data => {
                setProjects(data.projects);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Error fetching projects:', err);
                setError('Failed to load projects. Please try again later.');
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12 flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 pt-20 pb-32">
            {/* Hero section with App Library heading moved higher */}
            <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                    App Library
                </h1>
            </motion.div>

            {/* Projects grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                {projects.length > 0 ? (
                    <ProjectContainer projects={projects} />
                ) : (
                    <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">No projects found.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}