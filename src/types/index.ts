export interface User {
    id: string;
    username: string;
    password: string; // In a real app, this would be hashed
    name: string;
    email: string;
    role: 'user' | 'admin';
}

export interface Project {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    requiresAuth: boolean;
    tags: string[];
    demoUrl?: string;
}

export interface UserProjectData {
    userId: string;
    projectId: string;
    data: Record<string, any>; // User-specific data for a project
}