import { UserProjectData } from '@/types';

// In a real application, this would be stored in a database
const userProjectData: UserProjectData[] = [
    {
        userId: '1',
        projectId: 'file-uploader',
        data: {
            files: [
                { id: '1', name: 'admin-doc.pdf', size: 1024, uploadedAt: '2023-01-01T00:00:00Z' },
                { id: '2', name: 'screenshot.png', size: 512, uploadedAt: '2023-01-02T00:00:00Z' },
            ],
        },
    },
    {
        userId: '2',
        projectId: 'file-uploader',
        data: {
            files: [
                { id: '1', name: 'user-report.docx', size: 2048, uploadedAt: '2023-01-03T00:00:00Z' },
            ],
        },
    },
    {
        userId: '1',
        projectId: 'todo-app',
        data: {
            tasks: [
                { id: '1', title: 'Add more projects', completed: false },
                { id: '2', title: 'Improve auth system', completed: true },
            ],
        },
    },
    {
        userId: '2',
        projectId: 'todo-app',
        data: {
            tasks: [
                { id: '1', title: 'Test the application', completed: false },
            ],
        },
    },
];

export function getUserProjectData(userId: string, projectId: string): any {
    const data = userProjectData.find(
        item => item.userId === userId && item.projectId === projectId
    );

    return data?.data || null;
}

export function updateUserProjectData(userId: string, projectId: string, data: any): void {
    const index = userProjectData.findIndex(
        item => item.userId === userId && item.projectId === projectId
    );

    if (index !== -1) {
        // Update existing data
        userProjectData[index].data = data;
    } else {
        // Create new data entry
        userProjectData.push({
            userId,
            projectId,
            data,
        });
    }
}