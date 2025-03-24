'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackToLibrary from '@/components/projects/BackToLibrary';
import { Project } from '@/types';

// This component will be the actual project page shown when a user opens a project

interface ProjectPageProps {
    params: {
        id: string;
    };
}

export default function ProjectPage({ params }: ProjectPageProps) {
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        // Fetch project details
        fetch(`/api/projects/${params.id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setProject(data.project);
                }
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching project:', err);
                setError('Failed to load project details');
                setIsLoading(false);
            });
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="container mx-auto px-4 py-12">
                <BackToLibrary />
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error || 'Project not found'}</p>
                </div>
            </div>
        );
    }

    // For the chat assistant project, we'll redirect to the dedicated page
    if (project.id === 'chat-assistant') {
        router.push(`/projects/${project.id}/app`);
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Here we would render the actual project content
    // This is a placeholder, you would load the actual project component here
    return (
        <div className="min-h-screen">
            <BackToLibrary />

            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-6">{project.title}</h1>

                {/* This is where the actual project content would be rendered */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    {/* Project content goes here */}
                    <p className="text-gray-600 dark:text-gray-300">
                        {project.description}
                    </p>

                    {/* This would be replaced with actual project UI */}
                    <div className="mt-8 p-8 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                        <p className="text-lg">Project content would be displayed here</p>
                    </div>
                </div>
            </div>
        </div>
    );
}