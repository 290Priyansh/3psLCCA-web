import React, { useState } from 'react';
import MaterialAddModal from './MaterialAddModal';

const calcTotal = (row) => {
    const r = parseFloat(row.rate) || 0;
    const q = parseFloat(row.qty) || 0;
    return (r * q).toFixed(2);
};

export default function MaterialTable({ section, onRowChange, onRowDelete, onAddRow, projectData }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    return (
        <fieldset className="border rounded mb-4 p-3" style={{ borderColor: 'var(--app-border-mid)' }}>
            <legend className="w-auto px-2 m-0 fs-6 fw-bold" style={{ color: 'var(--app-text-primary)', backgroundColor: 'var(--app-bg-main)' }}>{section.name}</legend>
            <div className="table-responsive border rounded mb-3" style={{ backgroundColor: 'var(--app-bg-card)', borderColor: 'var(--app-border-mid)' }}>
                <table className="table table-sm table-borderless m-0 align-middle text-center" style={{ fontSize: '0.85rem' }}>
                    <thead style={{ backgroundColor: 'var(--app-bg-alt)' }}>
                        <tr>
                            <th rowSpan={2} className="text-start align-middle" style={{ width: '32%', color: 'var(--app-text-primary)', borderBottom: '1px solid var(--app-border-dark)', borderRight: '1px solid var(--app-border-mid)' }}>Work Name</th>
                            <th rowSpan={2} className="align-middle" style={{ width: '12%', color: 'var(--app-text-primary)', borderBottom: '1px solid var(--app-border-dark)', borderRight: '1px solid var(--app-border-mid)' }}>Rate</th>
                            <th colSpan={2} style={{ width: '16%', color: 'var(--app-text-primary)', borderBottom: '1px solid var(--app-border-mid)', borderRight: '1px solid var(--app-border-mid)', paddingBottom: '4px' }}>Qty</th>
                            <th rowSpan={2} className="align-middle" style={{ width: '18%', color: 'var(--app-text-primary)', borderBottom: '1px solid var(--app-border-dark)', borderRight: '1px solid var(--app-border-mid)' }}>Source</th>
                            <th rowSpan={2} className="align-middle" style={{ width: '13%', color: 'var(--app-text-primary)', borderBottom: '1px solid var(--app-border-dark)', borderRight: '1px solid var(--app-border-mid)' }}>Total</th>
                            <th rowSpan={2} className="align-middle" style={{ width: '9%', color: 'var(--app-text-primary)', borderBottom: '1px solid var(--app-border-dark)' }}>Action</th>
                        </tr>
                        <tr>
                            <th className="align-middle" style={{ width: '8%', color: 'var(--app-text-secondary)', borderBottom: '1px solid var(--app-border-dark)', borderRight: '1px solid var(--app-border-mid)', fontSize: '0.8rem', fontWeight: '500', paddingTop: '2px', paddingBottom: '4px' }}>Value</th>
                            <th className="align-middle" style={{ width: '8%', color: 'var(--app-text-secondary)', borderBottom: '1px solid var(--app-border-dark)', borderRight: '1px solid var(--app-border-mid)', fontSize: '0.8rem', fontWeight: '500', paddingTop: '2px', paddingBottom: '4px' }}>Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {section.rows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center" style={{ color: 'var(--app-text-muted)', padding: '18px', fontStyle: 'italic', fontSize: '0.78rem' }}>
                                    No items yet. Click "Add Material" below.
                                </td>
                            </tr>
                        ) : (
                            section.rows.map((row) => (
                                <tr key={row.id} style={{ borderBottom: '1px solid var(--app-border-light)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--app-bg-alt)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td className="text-start" style={{ borderRight: '1px solid var(--app-border-light)' }}>
                                        <input
                                            className="form-control form-control-sm border-0 rounded-1"
                                            style={{ color: 'var(--app-text-primary)', transition: 'all 0.3s', border: '1px solid transparent' }}
                                            type="text"
                                            value={row.workName}
                                            placeholder="Work name..."
                                            onChange={(e) => onRowChange(section.id, row.id, 'workName', e.target.value)}
                                        />
                                    </td>
                                    <td style={{ borderRight: '1px solid var(--app-border-light)' }}>
                                        <input
                                            className="form-control form-control-sm border-0 rounded-1 text-center"
                                            style={{ color: 'var(--app-text-primary)', transition: 'all 0.3s', border: '1px solid transparent' }}
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={row.rate}
                                            placeholder="0.00"
                                            onChange={(e) => onRowChange(section.id, row.id, 'rate', e.target.value)}
                                        />
                                    </td>
                                    <td style={{ borderRight: '1px solid var(--app-border-light)' }}>
                                        <input
                                            className="form-control form-control-sm border-0 rounded-1 text-center"
                                            style={{ color: 'var(--app-text-primary)', transition: 'all 0.3s', border: '1px solid transparent' }}
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={row.qty}
                                            placeholder="0"
                                            onChange={(e) => onRowChange(section.id, row.id, 'qty', e.target.value)}
                                        />
                                    </td>
                                    <td style={{ borderRight: '1px solid var(--app-border-light)' }}>
                                        <input
                                            className="form-control form-control-sm border-0 rounded-1 text-center"
                                            style={{ color: 'var(--app-text-primary)', transition: 'all 0.3s', border: '1px solid transparent' }}
                                            type="text"
                                            value={row.unit || ''}
                                            placeholder="Unit"
                                            onChange={(e) => onRowChange(section.id, row.id, 'unit', e.target.value)}
                                        />
                                    </td>
                                    <td style={{ borderRight: '1px solid var(--app-border-light)' }}>
                                        <input
                                            className="form-control form-control-sm border-0 rounded-1 text-center"
                                            style={{ color: 'var(--app-text-primary)', transition: 'all 0.3s', border: '1px solid transparent' }}
                                            type="text"
                                            value={row.source}
                                            placeholder="Source..."
                                            onChange={(e) => onRowChange(section.id, row.id, 'source', e.target.value)}
                                        />
                                    </td>
                                    <td style={{ borderRight: '1px solid var(--app-border-light)' }}>
                                        <span className="fw-medium" style={{ color: 'var(--app-text-primary)' }}>{calcTotal(row)}</span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm text-muted px-2 py-0 border-0"
                                            style={{ fontSize: '1.1rem', transition: 'color 0.2s, background-color 0.2s' }}
                                            title="Delete row"
                                            onClick={() => onRowDelete(section.id, row.id)}
                                            onMouseEnter={(e) => { e.target.style.color = '#e74c3c'; e.target.style.backgroundColor = 'rgba(231, 76, 60, 0.1)'; }}
                                            onMouseLeave={(e) => { e.target.style.color = 'var(--app-text-muted)'; e.target.style.backgroundColor = 'transparent'; }}
                                        >
                                            Γ£ò
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <button
                className="btn w-100"
                style={{ backgroundColor: 'var(--app-bg-card)', color: 'var(--app-text-primary)', border: '1px solid var(--app-border-mid)', fontSize: '0.85rem', transition: 'background-color 0.2s' }}
                onClick={() => setIsAddModalOpen(true)}
                onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--app-bg-alt)'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = 'var(--app-bg-card)'; }}
            >
                Add Material to {section.name}
            </button>
            {isAddModalOpen && (
                <MaterialAddModal
                    sectionName={section.name}
                    projectData={projectData}
                    onClose={() => setIsAddModalOpen(false)}
                    onAdd={(newRowData) => {
                        onAddRow(section.id, newRowData);
                        setIsAddModalOpen(false);
                    }}
                />
            )}
        </fieldset>
    );
}