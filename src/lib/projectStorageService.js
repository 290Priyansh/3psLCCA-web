import { databases, APPWRITE_CONFIG, ID, Query, account } from './appwrite';

/**
 * Helper to get the current Appwrite user ID if logged in
 */
const getCurrentUserId = async () => {
    try {
        const user = await account.get();
        return user.$id;
    } catch (e) {
        return null;
    }
};

/**
 * Service to abstract storing project data.
 * Checks if the user is a guest (sessionStorage.getItem('isGuest') === 'true').
 * If guest, uses localStorage.
 * If logged in, uses Appwrite Databases.
 */
export const projectStorageService = {
    async saveProject(projectId, projectData) {
        const isGuest = sessionStorage.getItem('isGuest') === 'true';
        
        if (isGuest) {
            // Guest mode: save to localStorage
            const storageKey = `project_data_${projectId}`;
            localStorage.setItem(storageKey, JSON.stringify(projectData));
            
            // Update recent projects list
            let recent = JSON.parse(localStorage.getItem('recentProjects') || '[]');
            const index = recent.findIndex(p => p.id === projectId);
            if (index > -1) {
                recent[index].name = projectData.name || recent[index].name;
            } else {
                recent.push({
                    id: projectId,
                    name: projectData.name || 'Unnamed Project',
                    date: 'just now'
                });
            }
            localStorage.setItem('recentProjects', JSON.stringify(recent));
        } else {
            // Logged in mode: save to Appwrite
            try {
                const userId = await getCurrentUserId();
                if (!userId) throw new Error("Not logged in");

                // Check if project exists in Appwrite
                try {
                    await databases.getDocument(
                        APPWRITE_CONFIG.databaseId,
                        APPWRITE_CONFIG.collectionId,
                        projectId
                    );
                    
                    // Exists, update it
                    await databases.updateDocument(
                        APPWRITE_CONFIG.databaseId,
                        APPWRITE_CONFIG.collectionId,
                        projectId,
                        {
                            name: projectData.name || 'Unnamed Project',
                            data: JSON.stringify(projectData)
                        }
                    );
                } catch (e) {
                    // Does not exist, create it
                    await databases.createDocument(
                        APPWRITE_CONFIG.databaseId,
                        APPWRITE_CONFIG.collectionId,
                        projectId,
                        {
                            name: projectData.name || 'Unnamed Project',
                            data: JSON.stringify(projectData),
                            userId: userId
                        }
                    );
                }
            } catch (err) {
                console.error("Failed to save project to cloud", err);
            }
        }
    },

    async loadProject(projectId) {
        const isGuest = sessionStorage.getItem('isGuest') === 'true';
        
        if (isGuest) {
            const storageKey = `project_data_${projectId}`;
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : null;
        } else {
            try {
                const doc = await databases.getDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collectionId,
                    projectId
                );
                return JSON.parse(doc.data);
            } catch (e) {
                console.error("Failed to load project from cloud", e);
                return null;
            }
        }
    },

    async listProjects() {
        const isGuest = sessionStorage.getItem('isGuest') === 'true';
        
        if (isGuest) {
            return JSON.parse(localStorage.getItem('recentProjects') || '[]');
        } else {
            try {
                const userId = await getCurrentUserId();
                if (!userId) return [];
                
                const response = await databases.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collectionId,
                    [
                        Query.equal('userId', userId),
                        Query.orderDesc('$createdAt')
                    ]
                );
                
                return response.documents.map(doc => ({
                    id: doc.$id,
                    name: doc.name,
                    date: new Date(doc.$createdAt).toLocaleDateString(),
                    pinned: false // You might want to add 'pinned' to Appwrite schema if needed
                }));
            } catch (e) {
                console.error("Failed to list projects from cloud", e);
                return [];
            }
        }
    },

    async deleteProject(projectId) {
        const isGuest = sessionStorage.getItem('isGuest') === 'true';
        
        if (isGuest) {
            localStorage.removeItem(`project_data_${projectId}`);
            let recent = JSON.parse(localStorage.getItem('recentProjects') || '[]');
            recent = recent.filter(p => p.id !== projectId);
            localStorage.setItem('recentProjects', JSON.stringify(recent));
        } else {
            try {
                await databases.deleteDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collectionId,
                    projectId
                );
            } catch (e) {
                console.error("Failed to delete project from cloud", e);
            }
        }
    }
};
