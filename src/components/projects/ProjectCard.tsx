import Link from 'next/link';
import { Project } from '@/types';
import { motion } from 'framer-motion';

interface ProjectCardProps {
    project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const projectUrl = `/projects/${project.id}`;
    
    // Get project-specific image URL
    const getImageUrl = () => {
        switch (project.id) {
            case 'file-uploader':
                return '/images/projects/file-uploader.svg';
            case 'chat-assistant':
                return '/images/projects/chat-assistant.svg';
            case 'literary-analysis':
                return '/images/projects/literary-analysis.svg';
            default:
                return '/placeholder.svg';
        }
    };
    
    return (
        <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all hover:shadow-xl"
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Link href={projectUrl} className="block relative h-48 cursor-pointer">
                <div 
                    className="w-full h-full bg-cover bg-center transition-opacity hover:opacity-90"
                    style={{ backgroundImage: `url('${getImageUrl()}')` }}
                />
            </Link>

            <div className="p-4">
                <Link href={projectUrl} className="block hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                </Link>

                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{project.description}</p>

                <div className="flex flex-wrap gap-2">
                    {project.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded"
                        >
                            {tag}
                        </span>
                    ))}

                    {project.requiresAuth && (
                        <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded">
                            Login Required
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}