import { Project } from '@/types';

export const projects: Project[] = [
    {
        id: 'file-uploader',
        title: 'File Uploader',
        description: 'A powerful file management application with drag & drop upload, file organization, previews, and sharing capabilities.',
        imageUrl: '/images/projects/file-uploader.svg',
        category: 'productivity',
        requiresAuth: true,
        tags: ['storage', 'upload', 'file management']
    },
    {
        id: 'chat-assistant',
        title: 'AI Chat Assistant',
        description: 'An advanced AI chat assistant with multiple models, file uploads, and conversation management. Have intelligent conversations with state-of-the-art AI models.',
        imageUrl: '/images/projects/chat-assistant.svg',
        category: 'ai',
        requiresAuth: true,
        tags: ['AI', 'chat', 'assistant', 'GPT', 'Claude']
    },
    {
        id: 'literary-analysis',
        title: 'Literary Analysis',
        description: 'An interactive analysis of Heinrich von Kleist\'s "Der zerbrochne Krug", with detailed annotations, character analysis, and historical context.',
        imageUrl: '/images/projects/literary-analysis.svg',
        category: 'education',
        requiresAuth: false,
        tags: ['literature', 'education', 'analysis', 'german']
    }
];

export function getProject(id: string): Project | undefined {
    return projects.find(project => project.id === id);
}

export function getAllProjects(): Project[] {
    return projects;
}