import React, { useState, useEffect, useMemo } from 'react';
import { useProjectData } from '../../../contexts/ProjectDataContext';

const MaterialEmissions = ({ controller }) => {
    const { projectData, updateProjectData } = useProjectData();
    const [materials, setMaterials] = useState([]);
    const [excludedIds, setExcludedIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);

    useEffect(() => {
        const STRUCTURE_CHUNKS = [
            ['foundation_data', 'Foundation'],
            ['substructure_data', 'Sub Structure'],
            ['superstructure_data', 'Super Structure'],
            ['miscellaneous_data', 'Miscellaneous']
        ];

        let allMats = [];
        STRUCTURE_CHUNKS.forEach(([chunkId, category]) => {
            const sections = projectData[chunkId] || [];
            sections.forEach(section => {
                const compName = section.name || '';
                const items = section.rows || [];
                items.forEach(item => {
                    allMats.push({
                        id: `${chunkId}-${item.id}`,
                        name: item.workName || 'Unnamed Material',
                        category: category,
                        component: compName,
                        quantity: parseFloat(item.qty || 0),
                        unit: item.unit || '',
                        cf: 1.0,
                        ef: item.carbonEmission ? parseFloat(item.carbonEmission.factor || 0) : 0,
                        chunkId: chunkId
                    });
                });
            });
        });
        setMaterials(allMats);

        const carbonData = projectData.carbon_emission_data || {};
        const matData = carbonData.material_emissions_data || {};
        if (matData.excluded_ids) {
            setExcludedIds(new Set(matData.excluded_ids));
        }
    }, [projectData]);

    const handleToggleInclusion = (id, include) => {
        const newSet = new Set(excludedIds);
        if (include) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExcludedIds(newSet);
        saveToEngine(newSet);
    };

    const saveToEngine = (newExcludedSet) => {
        const excludedList = Array.from(newExcludedSet);
        const prev = projectData.carbon_emission_data || {};
        updateProjectData('carbon_emission_data', {
            ...prev,
            material_emissions_data: {
                ...(prev.material_emissions_data || {}),
                excluded_ids: excludedList
            }
        });
    };

    const categoryTotals = useMemo(() => {
        const categories = ['Foundation', 'Sub Structure', 'Super Structure', 'Miscellaneous'];
        const totals = categories.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {});
        materials.forEach(m => {
            if (!excludedIds.has(m.id)) {
                totals[m.category] += m.quantity * m.cf * m.ef;
            }
        });
        return totals;
    }, [materials, excludedIds]);

    const totalCarbon = useMemo(() => {
        return Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);
    }, [categoryTotals]);

    const { included, excluded } = useMemo(() => {
        const filtered = materials.filter(m => 
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return {
            included: filtered.filter(m => !excludedIds.has(m.id)),
            excluded: filtered.filter(m => excludedIds.has(m.id))
        };
    }, [materials, excludedIds, searchTerm]);

    const renderTable = (items, isIncludedSection) => (
        <div className="table-responsive bg-transparent mb-4" style={{ border: 'none' }}>
            <table className="custom-carbon-table" style={{ fontSize: '0.78rem', color: 'var(--app-text-primary)' }}>
                <thead>
                    <tr>
                        <th rowSpan="2" style={{ width: '12%' }}>Category</th>
                        <th rowSpan="2" style={{ width: '22%' }}>Material</th>
                        <th colSpan="2">Qty</th>
                        <th rowSpan="2" style={{ width: '10%' }}>Conv. Factor</th>
                        <th colSpan="2">Emission</th>
                        <th rowSpan="2" className="text-end" style={{ width: '12%' }}>{isIncludedSection ? 'Total kgCO₂e' : 'Reason'}</th>
                        {isIncludedSection && <th rowSpan="2" style={{ width: '8%' }}>Warning</th>}
                        <th rowSpan="2" style={{ width: '6%' }}>Action</th>
                    </tr>
                    <tr>
                        <th style={{ width: '8%' }}>Value</th>
                        <th style={{ width: '6%' }}>Unit</th>
                        <th style={{ width: '9%' }}>Value</th>
                        <th style={{ width: '6%' }}>Unit</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(m => {
                        const totalEm = m.quantity * m.cf * m.ef;
                        return (
                            <tr key={m.id}>
                                <td className="text-secondary opacity-75">{m.category}</td>
                                <td className="fw-medium">{m.name}</td>
                                <td className="text-end font-monospace">{m.quantity.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                                <td className="text-center text-secondary opacity-50">{m.unit}</td>
                                <td className="text-center font-monospace">{m.cf.toFixed(2)}</td>
                                <td className="text-end font-monospace">{m.ef.toFixed(3)}</td>
                                <td className="text-center text-secondary opacity-50">{m.unit ? `kg/${m.unit}` : 'kg'}</td>
                                <td className="text-end fw-bold font-monospace" style={{ color: isIncludedSection ? 'var(--app-text-primary)' : 'var(--app-text-muted)' }}>
                                    {isIncludedSection ? totalEm.toLocaleString(undefined, { maximumFractionDigits: 3, minimumFractionDigits: 3 }) : '-'}
                                </td>
                                {isIncludedSection && <td className="text-center">-</td>}
                                <td className="text-center">
                                    <button 
                                        className={`btn btn-sm p-0 border-0 ${isIncludedSection ? 'text-danger' : 'text-success'}`}
                                        title={isIncludedSection ? "Exclude" : "Include"}
                                        onClick={() => handleToggleInclusion(m.id, !isIncludedSection)}
                                    >
                                        <i className={`bi ${isIncludedSection ? 'bi-trash' : 'bi-plus-circle'}`} style={{ fontSize: '0.85rem' }}></i>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={isIncludedSection ? 10 : 9} className="text-center py-4 text-secondary italic opacity-50">No materials found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="material-emissions d-flex flex-column h-100">
            {/* Top Summary Bar */}
            <div className="material-top-summary px-3 py-2 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: 'transparent', borderColor: 'var(--app-border-light)' }}>
                <div className="d-flex align-items-center gap-4 py-1" style={{ fontSize: '0.82rem' }}>
                    <div className="text-light">
                        Total: <span className="fw-bold">{totalCarbon.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span> <span className="text-secondary opacity-75">kgCO₂e</span>
                    </div>
                    <div className="text-light">
                        Included: <span className="fw-bold">{materials.length - excludedIds.size} of {materials.length} items</span>
                    </div>
                </div>
                
                <button 
                    className="btn btn-sm py-1 px-3 d-flex align-items-center gap-2 border-0" 
                    onClick={() => setIsDetailsVisible(!isDetailsVisible)}
                    style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: 'var(--app-bg-alt)', 
                        color: 'var(--app-text-primary)',
                        borderRadius: '4px',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                >
                    {isDetailsVisible ? 'Hide Details ▲' : 'Show Details ▼'}
                </button>
            </div>

            {/* Collapsible Details Row */}
            {isDetailsVisible && (
                <div className="d-flex gap-4 px-3 py-2 border-bottom animate-fade-in" style={{ fontSize: '0.78rem', backgroundColor: 'var(--app-bg-alt)', borderColor: 'var(--app-border-light)' }}>
                    {Object.entries(categoryTotals).map(([cat, total], idx, arr) => (
                        <React.Fragment key={cat}>
                            <div className="d-flex flex-column">
                                <span className="text-muted tiny text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>{cat}</span>
                                <span className="fw-bold" style={{ color: 'var(--app-text-primary)' }}>{total.toLocaleString(undefined, { maximumFractionDigits: 1 })} <small className="fw-normal opacity-50">kg</small></span>
                            </div>
                            {idx < arr.length - 1 && <div className="border-end" style={{ width: '1px', borderColor: 'var(--app-border-light)' }}></div>}
                        </React.Fragment>
                    ))}
                </div>
            )}

            <div className="px-3 pt-3 flex-grow-1 overflow-auto custom-scrollbar">
                <div className="mb-2 small fw-bold text-light opacity-90">Included in Carbon Calculation</div>
                {renderTable(included, true)}

                <div className="mb-4 mt-3 small fw-bold text-light opacity-90">Excluded from Carbon Calculation</div>
                {renderTable(excluded, false)}
            </div>

            <style>{`
                .material-emissions {
                    font-size: 0.8rem;
                }
                .custom-carbon-table {
                    border-collapse: separate;
                    border-spacing: 0;
                    width: 100%;
                }
                .custom-carbon-table th { 
                    background-color: #2a2a2a !important;
                    color: #d0d0d0 !important;
                    font-weight: 500;
                    font-size: 0.75rem;
                    padding: 4px 8px !important;
                    border: 1px solid #3d3d3d !important;
                    text-align: center;
                }
                .custom-carbon-table td {
                    padding: 4px 8px !important;
                    font-size: 0.78rem;
                    border: 1px solid #2d2d2d !important;
                    vertical-align: middle;
                }
                .custom-carbon-table tbody tr:hover {
                    background-color: rgba(255, 255, 255, 0.03);
                }
                .tiny { font-size: 0.65rem; }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--app-border-mid);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--app-text-secondary);
                }
            `}</style>
        </div>
    );
};

export default MaterialEmissions;