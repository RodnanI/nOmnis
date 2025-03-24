import { Project } from '@/types';
import ProjectCard from './ProjectCard';

interface ProjectContainerProps {
    projects: Project[];
}

export default function ProjectContainer({ projects }: ProjectContainerProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    );
}