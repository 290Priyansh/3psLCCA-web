import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ProjectDataContext = createContext();

export const useProjectData = () => useContext(ProjectDataContext);

export const ProjectDataProvider = ({ children, projectId = 'default', initialData, onStateChange }) => {
    const storageKey = `project_data_${projectId}`;

    const [projectData, setProjectData] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse project data from localStorage", e);
            }
        }
        return initialData || {
            name: 'Bridge_Assessment_01',
            general_info: {},
            bridge_data: {},
            financial_data: {},
            traffic_data: {},
            foundation_data: [],
            substructure_data: [],
            superstructure_data: [],
            miscellaneous_data: [],
            carbon_emission_data: {},
            maintenance_repair_data: {},
            recycling_data: {},
            demolition_data: {},
            outputs_data: {}
        };
    });

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(projectData));
        if (onStateChange) {
            onStateChange(projectData);
        }
    }, [projectData, storageKey, onStateChange]);

    const updateProjectData = useCallback((chunkName, data) => {
        setProjectData(prev => ({
            ...prev,
            [chunkName]: data
        }));
    }, []);

    const clearProjectData = useCallback(() => {
        setProjectData({
            name: 'Bridge_Assessment_01',
            general_info: {},
            bridge_data: {},
            financial_data: {},
            traffic_data: {},
            foundation_data: [],
            substructure_data: [],
            superstructure_data: [],
            miscellaneous_data: [],
            carbon_emission_data: {},
            maintenance_repair_data: {},
            recycling_data: {},
            demolition_data: {},
            outputs_data: {}
        });
    }, []);

    return (
        <ProjectDataContext.Provider value={{ projectData, updateProjectData, clearProjectData }}>
            {children}
        </ProjectDataContext.Provider>
    );
};

