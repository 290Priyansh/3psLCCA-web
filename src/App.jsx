import React, { useState, useEffect } from 'react'
import HomePage from './gui/components/Homepage'
import Loginpage from './gui/Login/Loginpage'
import ProjectLayout from './gui/components/ProjectLayout'
import ProjectInformationPlaceholder from './gui/components/global_info/ProjectInformationPlaceholder'
import BridgeData from './gui/components/bridgedata/BridgeData'
import FinancialData from './gui/components/financialdata/FinancialData'
import TrafficData from './gui/components/trafficdata/TrafficData'
import ConstructionWorkData from './gui/components/constructionworkdata/ConstructionWorkData'
import CarbonEmissionContainer from './gui/components/carbon_emission/CarbonEmissionContainer'
import Logs from './gui/components/Logs'
import MaintenanceAndRepair from './gui/components/maintenance_and_repair/MaintenanceAndRepair'
import Recycling from './gui/components/recycling/Recycling'
import Demolition from './gui/components/demolition/Demolition'
import Outputs from './gui/components/outputs/Outputs'
import { ProjectDataProvider } from './contexts/ProjectDataContext'
import './App.css'


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isProjectOpen, setIsProjectOpen] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState(() => localStorage.getItem('activeProjectId') || 'default_project')
  const [projectData, setProjectData] = useState({
    name: 'Bridge_Assessment_01',
    bridge_data: {},
    financial_data: {},
    traffic_data: {},
    construction_work_data: { "Super Structure": { total: 0 }, "grand_total": 0 },
    carbon_emission_data: {},
    maintenance_data: {},
    demolition_data: {},
    recycling_data: {}
  })
  const [activeNode, setActiveNode] = useState(() => localStorage.getItem('activeNode') || 'General Information')
  const [checkpoints, setCheckpoints] = useState(() => {
    const saved = localStorage.getItem('checkpoints')
    return saved ? JSON.parse(saved) : []
  })
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('logs')
    return saved ? JSON.parse(saved) : []
  })
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '')
  const [isLocked, setIsLocked] = useState(false)
  const [navTrigger, setNavTrigger] = useState(Date.now())

  useEffect(() => { localStorage.setItem('isLoggedIn', isLoggedIn); }, [isLoggedIn]);
  useEffect(() => { localStorage.setItem('isProjectOpen', isProjectOpen); }, [isProjectOpen]);
  useEffect(() => { localStorage.setItem('activeProjectId', activeProjectId); }, [activeProjectId]);
  useEffect(() => { localStorage.setItem('activeNode', activeNode); }, [activeNode]);
  useEffect(() => { localStorage.setItem('userName', userName); }, [userName]);
  useEffect(() => { localStorage.setItem('checkpoints', JSON.stringify(checkpoints)); }, [checkpoints]);
  useEffect(() => { localStorage.setItem('logs', JSON.stringify(logs)); }, [logs]);

  const [userSettings, setUserSettings] = useState(() => {
    const saved = localStorage.getItem('userSettings');
    return saved ? JSON.parse(saved) : {
      appearanceMode: 'Auto(follow os)',
      lightTheme: 'standard light',
      darkTheme: 'Dracula'
    };
  });

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
  }, [userSettings]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      if (userSettings.appearanceMode === 'dark') {
        setIsDarkMode(true);
      } else if (userSettings.appearanceMode === 'light') {
        setIsDarkMode(false);
      } else {
        // Auto
        setIsDarkMode(mediaQuery.matches);
      }
    };

    updateTheme(); // Call on appearanceMode change

    const handleChange = (e) => {
      if (userSettings.appearanceMode === 'Auto(follow os)') {
        setIsDarkMode(e.matches);
      }
    };
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', handleChange);
    else mediaQuery.addListener(handleChange);
    return () => {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', handleChange);
      else mediaQuery.removeListener(handleChange);
    };
  }, [userSettings.appearanceMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');

    if (isDarkMode) {
      if (userSettings.darkTheme === 'Dracula') {
        root.style.setProperty('--app-bg-main', '#282A36');
        root.style.setProperty('--app-bg-card', '#21222C');
        root.style.setProperty('--app-bg-alt', '#383A4A');
        root.style.setProperty('--app-border-mid', '#44475A');
        root.style.setProperty('--app-primary-accent', '#BD93F9');
        root.style.setProperty('--app-brand', '#90AF13');
        root.style.setProperty('--app-surface-pressed', '#565869');
        root.style.setProperty('--app-text-primary', '#F8F8F2');
        root.style.setProperty('--app-text-secondary', '#CED4ED');
        root.style.setProperty('--app-text-disabled', '#94A1D3');
        root.style.setProperty('--app-success', '#50FA7B');
        root.style.setProperty('--app-warning', '#FFB86C');
        root.style.setProperty('--app-danger', '#FF5555');
        root.style.setProperty('--app-info', '#8BE9FD');
      } else if (userSettings.darkTheme === 'Neon city standard dark') {
        root.style.setProperty('--app-bg-main', '#0C0F17');
        root.style.setProperty('--app-bg-card', '#121622');
        root.style.setProperty('--app-bg-alt', '#1A2030');
        root.style.setProperty('--app-border-mid', '#242B3D');
        root.style.setProperty('--app-primary-accent', '#E93CFF');
        root.style.setProperty('--app-brand', '#00D4FF');
        root.style.setProperty('--app-surface-pressed', '#2F3750');
        root.style.setProperty('--app-text-primary', '#E8ECF8');
        root.style.setProperty('--app-text-secondary', '#CDD4E5');
        root.style.setProperty('--app-text-disabled', '#6B738A');
        root.style.setProperty('--app-success', '#2EE6A6');
        root.style.setProperty('--app-warning', '#FFB020');
        root.style.setProperty('--app-danger', '#FF4D6D');
        root.style.setProperty('--app-info', '#3DA9FC');
      } else {
        root.style.setProperty('--app-bg-main', '#0F172A');
        root.style.setProperty('--app-bg-card', '#111827');
        root.style.setProperty('--app-bg-alt', '#1F2937');
        root.style.setProperty('--app-border-mid', '#374151');
        root.style.setProperty('--app-primary-accent', '#3B82F6');
        root.style.setProperty('--app-brand', '#2563EB');
        root.style.setProperty('--app-surface-pressed', '#4B5563');
        root.style.setProperty('--app-text-primary', '#E5E7EB');
        root.style.setProperty('--app-text-secondary', '#D1D5DB');
        root.style.setProperty('--app-text-disabled', '#6B7280');
        root.style.setProperty('--app-success', '#22C55E');
        root.style.setProperty('--app-warning', '#F59E0B');
        root.style.setProperty('--app-danger', '#EF4444');
        root.style.setProperty('--app-info', '#38BDF8');
      }
    } else {
      if (userSettings.lightTheme === 'soft pink') {
        root.style.setProperty('--app-bg-main', '#FDF2F8');
        root.style.setProperty('--app-bg-card', '#FFFFFF');
        root.style.setProperty('--app-bg-alt', '#FCE7F3');
        root.style.setProperty('--app-border-mid', '#FBCFE8');
        root.style.setProperty('--app-primary-accent', '#D94680');
        root.style.setProperty('--app-brand', '#EC4899');
        root.style.setProperty('--app-surface-pressed', '#F9A8D4');
        root.style.setProperty('--app-text-primary', '#4A044E');
        root.style.setProperty('--app-text-secondary', '#6B2155');
        root.style.setProperty('--app-text-disabled', '#A78B9C');
        root.style.setProperty('--app-success', '#22C55E');
        root.style.setProperty('--app-warning', '#F97316');
        root.style.setProperty('--app-danger', '#EF4444');
        root.style.setProperty('--app-info', '#3B82F6');
      } else if (userSettings.lightTheme === 'soft light') {
        root.style.setProperty('--app-bg-main', '#EFF1F5');
        root.style.setProperty('--app-bg-card', '#FFFFFF');
        root.style.setProperty('--app-bg-alt', '#E6E9EF');
        root.style.setProperty('--app-border-mid', '#CCD0DA');
        root.style.setProperty('--app-primary-accent', '#86A022');
        root.style.setProperty('--app-brand', '#90AF13');
        root.style.setProperty('--app-surface-pressed', '#DCE0E8');
        root.style.setProperty('--app-text-primary', '#4C4F69');
        root.style.setProperty('--app-text-secondary', '#6C6F85');
        root.style.setProperty('--app-text-disabled', '#9CA0B0');
        root.style.setProperty('--app-success', '#22C55E');
        root.style.setProperty('--app-warning', '#F97316');
        root.style.setProperty('--app-danger', '#EF4444');
        root.style.setProperty('--app-info', '#3B82F6');
      } else {
        root.style.setProperty('--app-bg-main', '#F8FAFC');
        root.style.setProperty('--app-bg-card', '#FFFFFF');
        root.style.setProperty('--app-bg-alt', '#F1F5F9');
        root.style.setProperty('--app-border-mid', '#E2E8F0');
        root.style.setProperty('--app-primary-accent', '#2563EB');
        root.style.setProperty('--app-brand', '#1D4ED8');
        root.style.setProperty('--app-surface-pressed', '#CBD5E1');
        root.style.setProperty('--app-text-primary', '#0F172A');
        root.style.setProperty('--app-text-secondary', '#475569');
        root.style.setProperty('--app-text-disabled', '#94A3B8');
        root.style.setProperty('--app-success', '#16A34A');
        root.style.setProperty('--app-warning', '#F59E0B');
        root.style.setProperty('--app-danger', '#DC2626');
        root.style.setProperty('--app-info', '#0284C7');
      }
    }
  }, [isDarkMode, userSettings]);

  const addLog = (message) => {
    const time = new Date().toTimeString().split(' ')[0]
    setLogs(prev => [...prev, `[${time}] ${message}`])
  }

  const updateProjectData = (section, data) => {
    setProjectData(prev => ({
      ...prev,
      [section]: data
    }))
  }

  const handleLogin = (isGuest = false, name = "Admin") => {
    setIsLoggedIn(true)
    setUserName(name)
    addLog(isGuest ? `Guest user '${name}' logged in.` : `User '${name}' logged in.`)
  }

  const handleProjectOpen = (projectId = 'default_project', projectName = 'Default Project') => {
    setActiveProjectId(projectId);
    setIsProjectOpen(true)
    addLog(`Project '${projectName}' opened successfully.`)
  }

  const handleNewProject = (data) => {
    const projectId = 'new_project_' + Date.now();
    setActiveProjectId(projectId);
    setProjectData({
      ...data,
      bridge_data: {},
      financial_data: {},
      traffic_data: {},
      construction_work_data: { "Super Structure": { total: 0 }, "grand_total": 0 },
      carbon_emission_data: {},
      maintenance_data: {},
      demolition_data: {},
      recycling_data: {}
    })
    setCheckpoints([])
    setLogs([])
    setIsLocked(false)
    setActiveNode('General Information')
    setIsProjectOpen(true)
    addLog(`New project '${data?.name || 'New Project'}' created.`)
  }

  const handleOpenProject = (data) => {
    const projectId = data?.id || 'opened_project';
    setActiveProjectId(projectId);
    setProjectData(data.project || data)
    if (data.checkpoints) {
      setCheckpoints(data.checkpoints)
    }
    if (data.logs) {
      setLogs(data.logs)
    } else {
      setLogs([])
    }
    setIsLocked(false)
    setActiveNode('General Information')
    setIsProjectOpen(true)
    addLog(`Project '${data?.name || 'Opened Project'}' opened successfully.`)
  }

  const handleSaveCheckpoint = (newCheckpoint) => {
    setCheckpoints(prev => [...prev, newCheckpoint])
    addLog(`Checkpoint '${newCheckpoint.label}' created.`)
  }

  const handleDeleteCheckpoint = (index) => {
    const cp = checkpoints[index]
    setCheckpoints(prev => prev.filter((_, i) => i !== index))
    addLog(`Checkpoint '${cp?.label || 'Unknown'}' deleted.`)
  }

  const handleClearLogs = () => {
    setLogs([])
  }

  const handleSetActiveNode = (node) => {
    setNavTrigger(Date.now())
    if (node !== activeNode) {
      setActiveNode(node)
      addLog(`Switched to ${node} view.`)
    }
  }

  const CONTENT_MAP = {
    'General Information': <ProjectInformationPlaceholder data={projectData.bridge_data} onUpdate={(d) => updateProjectData('bridge_data', d)} />,
    'Bridge Data': <BridgeData data={projectData.bridge_data} onUpdate={(d) => updateProjectData('bridge_data', d)} />,
    'Financial Data': <FinancialData data={projectData.financial_data} onUpdate={(d) => updateProjectData('financial_data', d)} />,
    'Traffic Data': <TrafficData data={projectData.traffic_data} onUpdate={(d) => updateProjectData('traffic_data', d)} />,
    'Construction Work Data': <ConstructionWorkData data={projectData.construction_work_data} onUpdate={(d) => updateProjectData('construction_work_data', d)} setActiveNode={setActiveNode} />,
    'Foundation': <ConstructionWorkData data={projectData.construction_work_data} onUpdate={(d) => updateProjectData('construction_work_data', d)} setActiveNode={setActiveNode} />,
    'Sub Structure': <ConstructionWorkData data={projectData.construction_work_data} onUpdate={(d) => updateProjectData('construction_work_data', d)} initialTab="SubStructure" setActiveNode={setActiveNode} />,
    'Super Structure': <ConstructionWorkData data={projectData.construction_work_data} onUpdate={(d) => updateProjectData('construction_work_data', d)} initialTab="SuperStructure" setActiveNode={setActiveNode} />,
    'Miscellaneous': <ConstructionWorkData data={projectData.construction_work_data} onUpdate={(d) => updateProjectData('construction_work_data', d)} initialTab="Miscellaneous" setActiveNode={setActiveNode} />,
    'Carbon Emission Data': <CarbonEmissionContainer data={projectData.carbon_emission_data} onUpdate={(d) => updateProjectData('carbon_emission_data', d)} />,
    'Material Emissions': <CarbonEmissionContainer data={projectData.carbon_emission_data} onUpdate={(d) => updateProjectData('carbon_emission_data', d)} initialTab="Material" />,
    'Transportation Emissions': <CarbonEmissionContainer data={projectData.carbon_emission_data} onUpdate={(d) => updateProjectData('carbon_emission_data', d)} initialTab="Transportation" />,
    'Machinery Emissions': <CarbonEmissionContainer data={projectData.carbon_emission_data} onUpdate={(d) => updateProjectData('carbon_emission_data', d)} initialTab="Machinery" />,
    'Traffic Diversion Emissions': <CarbonEmissionContainer data={projectData.carbon_emission_data} onUpdate={(d) => updateProjectData('carbon_emission_data', d)} initialTab="Traffic" />,
    'Social Cost of Carbon': <CarbonEmissionContainer data={projectData.carbon_emission_data} onUpdate={(d) => updateProjectData('carbon_emission_data', d)} initialTab="SocialCost" />,
    'Maintenance and Repair': <MaintenanceAndRepair />,
    'Recycling': <Recycling />,
    'Demolition': <Demolition />,
    'Logs': <Logs />,
    'Outputs': <Outputs addLog={addLog} />,
  }

  const handleRenameProject = (newName) => {
    if (projectData) {
      setProjectData(prev => ({ ...prev, name: newName }))
      addLog(`Project renamed to '${newName}'.`)
    }
  }

  const handleExportProject = () => {
    if (!projectData) return;
    
    const exportData = {
        project: projectData,
        checkpoints: checkpoints,
        logs: logs,
        exportedAt: new Date().toISOString()
    };
    
    // 1. Save to browser localStorage (simulating a internal file manager storage)
    const storageKey = `lcca_export_${projectData.name || 'unnamed'}`;
    localStorage.setItem(storageKey, JSON.stringify(exportData));
    
    // 2. Trigger file download for external storage
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectData.name || 'project'}_export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addLog(`Project exported and saved to local storage as '${storageKey}'.`);
  };

  if (!isLoggedIn) {
    const handleAdminLogin = (credentials) => {
      const namePart = credentials.email ? credentials.email.split('@')[0] : 'Admin';
      handleLogin(false, namePart);
    };
    return <Loginpage onLogin={handleAdminLogin} onGuestLogin={(name) => handleLogin(true, name || 'Guest')} />
  }

  if (isProjectOpen) {
    const content = CONTENT_MAP[activeNode] || null
    return (
      <ProjectDataProvider 
        key={activeProjectId} 
        projectId={activeProjectId}
        initialData={projectData}
        onStateChange={(data) => {
          setProjectData(prev => {
            if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
            return { ...prev, ...data };
          });
        }}
      >
        <ProjectLayout
          activeNode={activeNode}
        setActiveNode={handleSetActiveNode}
        onBackToHome={() => {
          setIsProjectOpen(false)
          addLog("Project closed. Returning to home.")
        }}
        checkpoints={checkpoints}
        onSaveCheckpoint={handleSaveCheckpoint}
        onDeleteCheckpoint={handleDeleteCheckpoint}
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        addLog={addLog}
        isLocked={isLocked}
        setIsLocked={setIsLocked}
        projectName={projectData?.name}
        projectData={projectData}
        onRenameProject={handleRenameProject}
        onExportProject={handleExportProject}
      >
        {content ? React.cloneElement(content, {
          checkpoints,
          logs,
          onClearLogs: handleClearLogs,
          isLocked: isLocked,
          navTrigger: navTrigger,
          projectData: projectData
        }) : <div className="p-4 text-muted fst-italic">Select a section from the sidebar to begin.</div>}
      </ProjectLayout>
      </ProjectDataProvider>
    )
  }

  return (
    <HomePage
      onProjectOpen={handleProjectOpen}
      userName={userName}
      isDarkMode={isDarkMode}
      userSettings={userSettings}
      setUserSettings={setUserSettings}
    />
  )
}

export default App
