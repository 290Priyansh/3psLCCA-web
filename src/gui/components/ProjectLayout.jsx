import React from 'react';
import ProjectNavbar from './ProjectNavbar';
import Sidebar from './Sidebar';

const ProjectLayout = ({ children, activeNode, setActiveNode, onBackToHome, checkpoints, onSaveCheckpoint, onDeleteCheckpoint, onNewProject, onOpenProject, addLog, isLocked, setIsLocked, projectName, projectData, onRenameProject, onExportProject }) => {
    return (
        <div className="d-flex flex-column overflow-hidden" style={{ height: '100vh', width: '100vw' }}>
            <ProjectNavbar 
                onBackToHome={onBackToHome} 
                setActiveNode={setActiveNode} 
                onSaveCheckpoint={onSaveCheckpoint}
                onDeleteCheckpoint={onDeleteCheckpoint}
                onNewProject={onNewProject}
                onOpenProject={onOpenProject}
                checkpoints={checkpoints}
                addLog={addLog}
                isLocked={isLocked}
                setIsLocked={setIsLocked}
                projectName={projectName}
                projectData={projectData}
                onRenameProject={onRenameProject}
                onExportProject={onExportProject}
            />
            <div className="d-flex flex-grow-1 overflow-hidden">
                <Sidebar activeNode={activeNode} setActiveNode={setActiveNode} />
                <div className="flex-grow-1 overflow-y-auto" style={{ backgroundColor: 'var(--app-bg-main)', transition: 'background-color 0.3s ease' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ProjectLayout;
