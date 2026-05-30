import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { backfillGeneralInfo } from '../utils/projectCreation';

const ProjectDataContext = createContext();

export const useProjectData = () => useContext(ProjectDataContext);

export const ProjectDataProvider = ({ children, projectId = 'default', initialData, onStateChange }) => {
    const [projectData, setProjectData] = useState(() => {
        return backfillGeneralInfo(initialData) || {
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
        // We notify parent, parent saves to cloud or local via projectStorageService
        if (onStateChange) {
            onStateChange(projectData);
        }
    }, [projectData, onStateChange]);

    const updateProjectData = useCallback((chunkName, data) => {
        setProjectData(prev => {
            const next = { ...prev, [chunkName]: data };
            if (chunkName === 'general_info' && data?.project_name && data.project_name !== prev.name) {
                next.name = data.project_name;
            }
            return next;
        });
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

