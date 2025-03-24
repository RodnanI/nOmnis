import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface FileMetadata {
    id: string;
    name: string;
    size: number;
    type: string;
    path: string;
    createdAt: string;
    updatedAt: string;
    parentId: string | null; // null for root directory
    isPublic: boolean; // Whether the file is public or private
    ownerId: string; // The ID of the user who owns this file
}

export interface FolderMetadata {
    id: string;
    name: string;
    path: string;
    createdAt: string;
    updatedAt: string;
    parentId: string | null; // null for root directory
    isPublic: boolean; // Whether the folder is public or private
    ownerId: string; // The ID of the user who owns this folder
}

export type FileSystemItem = (FileMetadata & { isFolder: false }) | (FolderMetadata & { isFolder: true });

// Ensure user directory exists
export function ensureUserDirectory(userId: string): void {
    const userDir = path.join(DATA_DIR, userId);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });

        // Create metadata file
        const metadataPath = path.join(userDir, 'metadata.json');
        if (!fs.existsSync(metadataPath)) {
            fs.writeFileSync(metadataPath, JSON.stringify({
                files: [],
                folders: [
                    {
                        id: 'root',
                        name: 'Root',
                        path: '/',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        parentId: null,
                        isPublic: false,
                        ownerId: userId
                    }
                ]
            }));
        }
    }
}

// Save file to user directory
export async function saveFile(
    userId: string,
    file: any,
    parentId: string | null = null,
    isPublic: boolean = true
): Promise<FileMetadata> {
    ensureUserDirectory(userId);

    const userDir = path.join(DATA_DIR, userId);
    const fileId = uuidv4();
    const fileExt = path.extname(file.name);
    const fileName = `${fileId}${fileExt}`;
    const filePath = path.join(userDir, fileName);

    // Save file to disk
    const fileBuffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(fileBuffer));

    // Update metadata
    const metadata = getMetadata(userId);
    const fileMetadata: FileMetadata = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        path: fileName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentId,
        isPublic,
        ownerId: userId
    };

    metadata.files.push(fileMetadata);
    saveMetadata(userId, metadata);

    return fileMetadata;
}

// Get file
export function getFile(userId: string, fileId: string): Buffer | null {
    const metadata = getMetadata(userId);
    const file = metadata.files.find(f => f.id === fileId);

    if (!file) return null;

    const filePath = path.join(DATA_DIR, userId, file.path);
    if (!fs.existsSync(filePath)) return null;

    return fs.readFileSync(filePath);
}

// Download a public file from another user
export function getPublicFile(ownerId: string, fileId: string): { data: Buffer | null, metadata: FileMetadata | null } {
    try {
        const metadata = getMetadata(ownerId);
        const file = metadata.files.find(f => f.id === fileId && f.isPublic);
        
        if (!file) return { data: null, metadata: null };
        
        const filePath = path.join(DATA_DIR, ownerId, file.path);
        if (!fs.existsSync(filePath)) return { data: null, metadata: null };
        
        return { 
            data: fs.readFileSync(filePath),
            metadata: file
        };
    } catch (error) {
        console.error('Error fetching public file:', error);
        return { data: null, metadata: null };
    }
}

// Delete file
export function deleteFile(userId: string, fileId: string): boolean {
    const metadata = getMetadata(userId);
    const fileIndex = metadata.files.findIndex(f => f.id === fileId);

    if (fileIndex === -1) return false;

    const file = metadata.files[fileIndex];
    const filePath = path.join(DATA_DIR, userId, file.path);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    metadata.files.splice(fileIndex, 1);
    saveMetadata(userId, metadata);

    return true;
}

// Create folder
export function createFolder(
    userId: string,
    name: string,
    parentId: string | null = null,
    isPublic: boolean = true
): FolderMetadata {
    ensureUserDirectory(userId);

    const metadata = getMetadata(userId);
    const folderId = uuidv4();

    const folderMetadata: FolderMetadata = {
        id: folderId,
        name,
        path: `/${folderId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentId,
        isPublic,
        ownerId: userId
    };

    metadata.folders.push(folderMetadata);
    saveMetadata(userId, metadata);

    return folderMetadata;
}

// Delete folder (recursively)
export function deleteFolder(userId: string, folderId: string): boolean {
    if (folderId === 'root') return false; // Cannot delete root

    const metadata = getMetadata(userId);

    // Remove folder
    const folderIndex = metadata.folders.findIndex(f => f.id === folderId);
    if (folderIndex === -1) return false;
    metadata.folders.splice(folderIndex, 1);

    // Remove all files in folder
    metadata.files = metadata.files.filter(file => {
        if (file.parentId === folderId) {
            const filePath = path.join(DATA_DIR, userId, file.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return false;
        }
        return true;
    });

    // Recursively delete subfolders
    const subFolders = metadata.folders.filter(f => f.parentId === folderId);
    subFolders.forEach(folder => deleteFolder(userId, folder.id));

    saveMetadata(userId, metadata);
    return true;
}

// Rename file/folder
export function rename(userId: string, id: string, newName: string, isFolder: boolean): boolean {
    const metadata = getMetadata(userId);

    if (isFolder) {
        const folder = metadata.folders.find(f => f.id === id);
        if (!folder) return false;
        folder.name = newName;
        folder.updatedAt = new Date().toISOString();
    } else {
        const file = metadata.files.find(f => f.id === id);
        if (!file) return false;
        file.name = newName;
        file.updatedAt = new Date().toISOString();
    }

    saveMetadata(userId, metadata);
    return true;
}

// Toggle public/private status
export function togglePublicStatus(userId: string, id: string, isFolder: boolean, isPublic: boolean): boolean {
    const metadata = getMetadata(userId);

    if (isFolder) {
        const folder = metadata.folders.find(f => f.id === id);
        if (!folder) return false;
        folder.isPublic = isPublic;
        folder.updatedAt = new Date().toISOString();
    } else {
        const file = metadata.files.find(f => f.id === id);
        if (!file) return false;
        file.isPublic = isPublic;
        file.updatedAt = new Date().toISOString();
    }

    saveMetadata(userId, metadata);
    return true;
}

// List items in a folder
export function listItems(userId: string, folderId: string | null = null): FileSystemItem[] {
    const metadata = getMetadata(userId);

    const files = metadata.files
        .filter(file => file.parentId === folderId)
        .map(file => ({ ...file, isFolder: false as const }));

    const folders = metadata.folders
        .filter(folder => folder.parentId === folderId)
        .map(folder => ({ ...folder, isFolder: true as const }));

    return [...folders, ...files];
}

// List public files from all users
export function listPublicFiles(): FileSystemItem[] {
    const allFiles: FileSystemItem[] = [];
    
    // Read all user directories
    const userDirs = fs.readdirSync(DATA_DIR).filter(dir => {
        return fs.statSync(path.join(DATA_DIR, dir)).isDirectory() && 
               fs.existsSync(path.join(DATA_DIR, dir, 'metadata.json'));
    });
    
    // Get public files and folders from each user
    for (const userId of userDirs) {
        try {
            const metadata = getMetadata(userId);
            
            const publicFiles = metadata.files
                .filter(file => file.isPublic)
                .map(file => ({ ...file, isFolder: false as const }));
                
            const publicFolders = metadata.folders
                .filter(folder => folder.isPublic && folder.id !== 'root')
                .map(folder => ({ ...folder, isFolder: true as const }));
                
            allFiles.push(...publicFiles, ...publicFolders);
        } catch (error) {
            console.error(`Error reading metadata for user ${userId}:`, error);
        }
    }
    
    return allFiles;
}

// Helper functions
export function getMetadata(userId: string): { files: FileMetadata[], folders: FolderMetadata[] } {
    const metadataPath = path.join(DATA_DIR, userId, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
        ensureUserDirectory(userId);
    }

    const data = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(data);
}

function saveMetadata(userId: string, metadata: { files: FileMetadata[], folders: FolderMetadata[] }): void {
    const metadataPath = path.join(DATA_DIR, userId, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}