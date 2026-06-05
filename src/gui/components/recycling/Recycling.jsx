import React, { useState, useEffect } from 'react';
import { useProjectData } from '../../../contexts/ProjectDataContext';
import EditRecyclabilityModal from './EditRecyclabilityModal';
import { FaEdit, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const INCLUDED_DATA = [
    { id: 1, category: 'Foundation', material: 'Steel Rebar (Fe500)', qtyValue: '5.210', qtyUnit: 't', recyclability: '75.0%', recyclableQty: '3.907 t', scrapRate: '32500.000', recoveredValue: '126,993.750' },
    { id: 2, category: 'Foundation', material: 'Steel Rebar (Fe500)', qtyValue: '1.677', qtyUnit: 't', recyclability: '75.0%', recyclableQty: '1.258 t', scrapRate: '32500.000', recoveredValue: '40,876.875' },
    { id: 3, category: 'Sub Structure', material: 'Steel Rebar (Fe500)', qtyValue: '2.102', qtyUnit: 't', recyclability: '75.0%', recyclableQty: '1.576 t', scrapRate: '32500.000', recoveredValue: '51,236.250' },
    { id: 4, category: 'Sub Structure', material: 'Steel Rebar (Fe500)', qtyValue: '0.032', qtyUnit: 't', recyclability: '75.0%', recyclableQty: '0.024 t', scrapRate: '32500.000', recoveredValue: '789.750' },
    { id: 5, category: 'Super Structure', material: 'Structural Steel main Girder (Fe 410 B)', qtyValue: '62.192', qtyUnit: 't', recyclability: '95.0%', recyclableQty: '59.083 t', scrapRate: '26000.000', recoveredValue: '1,536,150.588' },
    { id: 6, category: 'Super Structure', material: 'Steel Rebar (Fe500)', qtyValue: '10.143', qtyUnit: 't', recyclability: '75.0%', recyclableQty: '7.607 t', scrapRate: '32500.000', recoveredValue: '247,235.625' },
    { id: 7, category: 'Super Structure', material: 'Steel Decking Sheet (310 MPA)', qtyValue: '3.105', qtyUnit: 't', recyclability: '95.0%', recyclableQty: '2.950 t', scrapRate: '26000.000', recoveredValue: '76,702.762' },
    { id: 8, category: 'Misc', material: 'Mild Steel railing', qtyValue: '35.000', qtyUnit: 'm', recyclability: '95.0%', recyclableQty: '33.250 m', scrapRate: '26000.000', recoveredValue: '864,500.000' },
];

const EXCLUDED_DATA = [
    { id: 9, category: 'Foundation', material: 'Soft Rock (0 to 1.5m)', qtyValue: '39.984', qtyUnit: 'm³', recyclability: '0.0%', scrapRate: '0.000', reason: 'Missing Data' },
    { id: 10, category: 'Foundation', material: 'Concreting of bored pile (M35) (1000mm) (5 to 10m)', qtyValue: '40.000', qtyUnit: 'm', recyclability: '0.0%', scrapRate: '0.000', reason: 'Missing Data' },
    { id: 11, category: 'Foundation', material: 'Plain Cement Concrete (M15)', qtyValue: '3.136', qtyUnit: 'm³', recyclability: '0.0%', scrapRate: '0.000', reason: 'Missing Data' },
    { id: 12, category: 'Foundation', material: 'Concreting of pile cap (M35)', qtyValue: '29.375', qtyUnit: 'm³', recyclability: '0.0%', scrapRate: '0.000', reason: 'Missing Data' },
    { id: 13, category: 'Sub Structure', material: 'Concreting in Pier(M35) (5 to 7.5m)', qtyValue: '9.570', qtyUnit: 'm³', recyclability: '0.0%', scrapRate: '0.000', reason: 'Missing Data' },
    { id: 14, category: 'Sub Structure', material: 'Steel Rebar (Fe500)', qtyValue: '2.175', qtyUnit: 't', recyclability: '0.0%', scrapRate: '0.000', reason: 'Missing Data' },
    { id: 15, category: 'Sub Structure', material: 'Concreting of pier cap M35', qtyValue: '19.540', qtyUnit: 'm³', recyclability: '0.0%', scrapRate: '0.000', reason: 'Missing Data' },
];

const Recycling = () => {
    const { projectData, updateProjectData } = useProjectData();
    const [included, setIncluded] = useState(() => {
        const saved = projectData.recycling_data;
        return (saved && saved.included) ? saved.included : INCLUDED_DATA;
    });
    const [excluded, setExcluded] = useState(() => {
        const saved = projectData.recycling_data;
        return (saved && saved.excluded) ? saved.excluded : EXCLUDED_DATA;
    });
    const [editingItem, setEditingItem] = useState(null);

    const handleEdit = (item) => {
        setEditingItem(item);
    };

    const handleSave = (updatedItem) => {
        if (included.find(i => i.id === updatedItem.id)) {
            setIncluded(included.map(i => i.id === updatedItem.id ? updatedItem : i));
        } else {
            setExcluded(excluded.map(i => i.id === updatedItem.id ? updatedItem : i));
        }
    };

    const handleExclude = (item) => {
        setIncluded(prev => prev.filter(i => i.id !== item.id));
        setExcluded(prev => [...prev, item]);
    };

    const handleInclude = (item) => {
        setExcluded(prev => prev.filter(i => i.id !== item.id));
        setIncluded(prev => [...prev, item]);
    };

    const headerStyle = {
        padding: '10px 16px',
        borderBottom: '1px solid var(--app-border-mid)',
        color: 'var(--app-text-secondary)',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        backgroundColor: 'var(--app-bg-card)',
    };

    const cellStyle = {
        padding: '10px 16px',
        borderBottom: '1px solid var(--app-border-light)',
        fontSize: '0.85rem',
        color: 'var(--app-text-primary)',
        verticalAlign: 'middle',
    };

    const totalRecoveredValue = included.reduce((sum, item) => {
        const val = parseFloat(String(item.recoveredValue).replace(/,/g, '')) || 0;
        return sum + val;
    }, 0);

    useEffect(() => {
        updateProjectData('recycling_data', {
            included,
            excluded,
            total_recovered_value: totalRecoveredValue,
        });
    }, [included, excluded, totalRecoveredValue, updateProjectData]);

    return (
        <div className="h-100 d-flex flex-column overflow-hidden" style={{ backgroundColor: 'var(--app-bg-main)', color: 'var(--app-text-primary)' }}>
            {/* Header Area */}
            <div className="d-flex align-items-center justify-content-between p-3 border-bottom" style={{ backgroundColor: 'var(--app-bg-card)', borderColor: 'var(--app-border-light) !important' }}>
                <div className="d-flex gap-4">
                    <span>Total Recovered Value: <strong>{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(totalRecoveredValue)}</strong></span>
                    <span className="text-muted">Included: {included.length} of {included.length + excluded.length} items</span>
                </div>
                <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                    Show Details <FaChevronDown size={12} />
                </div>
            </div>

            <div className="flex-grow-1 overflow-auto p-3 custom-scrollbar">
                
                {/* Included Table */}
                <h6 className="mb-3 mt-2 fw-bold">Included in Recyclability</h6>
                <div className="table-responsive rounded border border-secondary mb-4" style={{ backgroundColor: 'var(--app-bg-card)' }}>
                    <table className="table table-borderless table-hover m-0" style={{ '--bs-table-bg': 'transparent' }}>
                        <thead>
                            <tr>
                                <th style={headerStyle}>Category</th>
                                <th style={headerStyle}>Material</th>
                                <th style={headerStyle} className="text-center">
                                    Qty
                                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                                        <span>Value</span><span>Unit</span>
                                    </div>
                                </th>
                                <th style={headerStyle} className="text-end">Recyclability %</th>
                                <th style={headerStyle} className="text-end">Recyclable Qty</th>
                                <th style={headerStyle} className="text-end">Scrap Rate</th>
                                <th style={headerStyle} className="text-end">Recovered Value</th>
                                <th style={headerStyle} className="text-end">Warning</th>
                                <th style={headerStyle} className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {included.map(item => (
                                <tr key={item.id}>
                                    <td style={cellStyle}>{item.category}</td>
                                    <td style={cellStyle}>{item.material}</td>
                                    <td style={cellStyle} className="text-center">
                                        <div className="d-flex justify-content-between">
                                            <span>{item.qtyValue}</span>
                                            <span className="text-muted ms-2">{item.qtyUnit}</span>
                                        </div>
                                    </td>
                                    <td style={cellStyle} className="text-end">{item.recyclability}</td>
                                    <td style={cellStyle} className="text-end">{item.recyclableQty}</td>
                                    <td style={cellStyle} className="text-end">{item.scrapRate}</td>
                                    <td style={cellStyle} className="text-end">{item.recoveredValue}</td>
                                    <td style={cellStyle} className="text-end"></td>
                                    <td style={cellStyle} className="text-center">
                                        <div className="d-flex justify-content-center gap-3">
                                            <FaEdit style={{ cursor: 'pointer', color: 'var(--app-text-muted)' }} title="Edit" onClick={() => handleEdit(item)} />
                                            <FaChevronDown style={{ cursor: 'pointer', color: '#dc3545' }} title="Exclude" onClick={() => handleExclude(item)} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Excluded Table */}
                <h6 className="mb-3 mt-4 fw-bold">Excluded from Recyclability</h6>
                <div className="table-responsive rounded border border-secondary" style={{ backgroundColor: 'var(--app-bg-card)', marginBottom: '50px' }}>
                    <table className="table table-borderless table-hover m-0" style={{ '--bs-table-bg': 'transparent' }}>
                        <thead>
                            <tr>
                                <th style={headerStyle}>Category</th>
                                <th style={headerStyle}>Material</th>
                                <th style={headerStyle} className="text-center">
                                    Qty
                                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                                        <span>Value</span><span>Unit</span>
                                    </div>
                                </th>
                                <th style={headerStyle} className="text-end">Recyclability %</th>
                                <th style={headerStyle}>Scrap Rate Reason</th>
                                <th style={headerStyle} className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {excluded.map(item => (
                                <tr key={item.id}>
                                    <td style={cellStyle}>{item.category}</td>
                                    <td style={cellStyle}>{item.material}</td>
                                    <td style={cellStyle} className="text-center">
                                        <div className="d-flex justify-content-between">
                                            <span>{item.qtyValue}</span>
                                            <span className="text-muted ms-2">{item.qtyUnit}</span>
                                        </div>
                                    </td>
                                    <td style={cellStyle} className="text-end">{item.recyclability}</td>
                                    <td style={cellStyle}>
                                        <span className="me-2">{item.scrapRate}</span> 
                                        <span className="text-muted">{item.reason}</span>
                                    </td>
                                    <td style={cellStyle} className="text-center">
                                        <div className="d-flex justify-content-center gap-3">
                                            <FaEdit style={{ cursor: 'pointer', color: 'var(--app-text-muted)' }} title="Edit" onClick={() => handleEdit(item)} />
                                            <FaChevronUp style={{ cursor: 'pointer', color: '#198754' }} title="Include" onClick={() => handleInclude(item)} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Modal */}
            <EditRecyclabilityModal 
                show={!!editingItem} 
                item={editingItem} 
                onClose={() => setEditingItem(null)} 
                onSave={handleSave} 
            />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: var(--app-bg-main);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--app-border-mid);
                    border-radius: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--app-text-muted);
                }
            `}</style>
        </div>
    );
};

export default Recycling;
