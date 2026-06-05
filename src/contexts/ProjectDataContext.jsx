import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createDefaultProject, normalizeProjectData } from '../utils/projectSchema';

const ProjectDataContext = createContext();

export const useProjectData = () => useContext(ProjectDataContext);

export const ProjectDataProvider = ({ children, projectId = 'default', initialData, onStateChange }) => {
    const [projectData, setProjectData] = useState(() => {
        return normalizeProjectData(initialData);
    });

    useEffect(() => {
        // We notify parent, parent saves to cloud or local via projectStorageService
        if (onStateChange) {
            onStateChange(projectData);
        }
    }, [projectData, onStateChange]);

    const updateProjectData = useCallback((chunkName, data) => {
        setProjectData(prev => {
            const next = { ...prev, [chunkName]: data };
            if (chunkName === 'maintenance_repair_data') {
                next.maintenance_data = data;
            }
            if (chunkName === 'general_info' && data?.project_name && data.project_name !== prev.name) {
                next.name = data.project_name;
            }
            return next;
        });
    }, []);

    const clearProjectData = useCallback(() => {
        setProjectData(createDefaultProject());
    }, []);

    return (
        <ProjectDataContext.Provider value={{ projectData, updateProjectData, clearProjectData }}>
            {children}
        </ProjectDataContext.Provider>
    );
};
