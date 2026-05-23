import React, { useState, useEffect } from 'react';
import MaterialEmissions from './MaterialEmissions';
import TransportationEmissions from './TransportationEmissions';
import MachineryEmissions from './MachineryEmissions';
import TrafficEmissions from './TrafficEmissions';
import SocialCost from './SocialCost';

const TABS = [
    { key: 'Material',       label: 'Material Emissions',          component: MaterialEmissions },
    { key: 'Transportation', label: 'Transportation Emissions',    component: TransportationEmissions },
    { key: 'Machinery',      label: 'Machinery Emissions',         component: MachineryEmissions },
    { key: 'Traffic',        label: 'Traffic Diversion Emissions', component: TrafficEmissions },
    { key: 'SocialCost',     label: 'Social Cost of Carbon',       component: SocialCost },
];

const CarbonEmissionContainer = ({ controller, initialTab = 'Material' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const handleTabClick = (tab) => {
        setActiveTab(tab.key);
    };

    const ActiveComponent = TABS.find((t) => t.key === activeTab)?.component ?? MaterialEmissions;

    return (
        <div className="d-flex flex-column h-100 overflow-hidden" style={{ backgroundColor: 'var(--app-bg-main)', color: 'var(--app-text-primary)' }}>
            {/* Native-style Tab Bar */}
            <div className="d-flex border-bottom px-2 flex-shrink-0" style={{ backgroundColor: 'var(--app-bg-card)', borderColor: 'var(--app-border-light)' }}>
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            className={`btn rounded-0 px-3 py-2 border-0 fw-medium ${isActive ? 'fw-bold active-tab-btn' : ''}`}
                            style={{
                                color: isActive ? 'var(--app-primary-accent)' : 'var(--app-text-secondary)',
                                borderBottom: isActive ? '2px solid var(--app-primary-accent)' : '2px solid transparent',
                                fontSize: '0.82rem',
                                whiteSpace: 'nowrap',
                                backgroundColor: 'transparent',
                                transition: 'color 0.2s ease'
                            }}
                            onClick={() => handleTabClick(tab)}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Active tab content */}
            <div className="flex-grow-1 overflow-y-auto custom-scrollbar">
                <div className="p-3 pt-0">
                    <ActiveComponent controller={controller} />
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 14px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: var(--app-bg-main);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--app-text-muted);
                    border-radius: 10px;
                    border: 3px solid var(--app-bg-main);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--app-text-secondary);
                }
                .custom-scrollbar::-webkit-scrollbar-button:single-button {
                    background-color: var(--app-bg-main);
                    display: block;
                    background-size: 7px;
                    background-repeat: no-repeat;
                }
                .custom-scrollbar::-webkit-scrollbar-button:single-button:vertical:decrement {
                    height: 14px;
                    width: 14px;
                    background-position: center 6px;
                    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='rgb(150,150,150)'><polygon points='50,0 0,100 100,100'/></svg>");
                }
                .custom-scrollbar::-webkit-scrollbar-button:single-button:vertical:increment {
                    height: 14px;
                    width: 14px;
                    background-position: center 4px;
                    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='rgb(150,150,150)'><polygon points='0,0 100,0 50,100'/></svg>");
                }
                .active-tab-btn {
                    color: var(--app-primary-accent) !important;
                }
                button:hover {
                    color: var(--app-text-primary) !important;
                    background-color: var(--app-bg-alt) !important;
                }
            `}</style>
        </div>
    );
};

export default CarbonEmissionContainer;
