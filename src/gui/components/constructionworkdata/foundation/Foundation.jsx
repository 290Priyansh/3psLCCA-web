import React, { useState, useCallback, useEffect } from 'react';
import { useProjectData } from '../../../../contexts/ProjectDataContext';
import { normalizeConstructionSections } from '../../../../utils/projectPageSchema';
import '../ConstructionWorkData.css';
import MaterialTable from '../MaterialTable';

// ── Helpers ───────────────────────────────────────────────────────────────────

let _uid = 0;
const uid = () => `row-${++_uid}`;

const emptyRow = () => ({
    id: uid(),
    workName: '',
    rate: '',
    qty: '',
    source: '',
});

// ── Default sections for Foundation ──────────────────────────────────────────

const DEFAULT_SECTIONS = [
    { id: 'excavation', name: 'Excavation', rows: [] },
    { id: 'pile',       name: 'Pile',       rows: [] },
    { id: 'pile-cap',   name: 'Pile Cap',   rows: [] },
];

const defaultSections = () => normalizeConstructionSections(DEFAULT_SECTIONS, 'foundation');

// (MaterialTable imported from shared component)

// ── Foundation main component ─────────────────────────────────────────────────

const Foundation = ({ controller }) => {
    const { projectData, updateProjectData } = useProjectData();
    const [sections, setSections] = useState(() => {
        const saved = projectData.foundation_data;
        return (saved && saved.length > 0) ? normalizeConstructionSections(saved, 'foundation') : defaultSections();
    });

    useEffect(() => {
        const next = projectData.foundation_data?.length
            ? normalizeConstructionSections(projectData.foundation_data, 'foundation')
            : defaultSections();
        setSections(prev => JSON.stringify(next) !== JSON.stringify(prev) ? next : prev);
    }, [projectData.foundation_data]);

    useEffect(() => {
        updateProjectData('foundation_data', sections);
    }, [sections, updateProjectData]);

    const handleRowChange = useCallback((sectionId, rowId, field, value) => {
        setSections((prev) => {
            const next = prev.map((sec) =>
                sec.id !== sectionId ? sec : {
                    ...sec,
                    rows: sec.rows.map((r) =>
                        r.id !== rowId ? r : { ...r, [field]: value }
                    ),
                }
            );
            return next;
        });
    }, []);

    const handleRowDelete = useCallback((sectionId, rowId) => {
        setSections((prev) => {
            const next = prev.map((sec) =>
                sec.id !== sectionId ? sec : {
                    ...sec,
                    rows: sec.rows.filter((r) => r.id !== rowId),
                }
            );
            return next;
        });
    }, []);

    const handleRowUpdate = useCallback((sectionId, rowId, updatedRowData) => {
        setSections((prev) => {
            const next = prev.map((sec) =>
                sec.id !== sectionId ? sec : {
                    ...sec,
                    rows: sec.rows.map((r) =>
                        r.id !== rowId ? r : { ...r, ...updatedRowData }
                    ),
                }
            );
            return next;
        });
    }, []);

    const handleDeleteSection = useCallback((sectionId) => {
        if (window.confirm("Are you sure you want to delete this component section?")) {
            setSections((prev) => prev.filter((sec) => sec.id !== sectionId));
        }
    }, []);

    const handleAddRow = useCallback((sectionId, newRowData) => {
        setSections((prev) => {
            const next = prev.map((sec) =>
                sec.id !== sectionId ? sec : {
                    ...sec,
                    rows: [...sec.rows, { id: uid(), ...newRowData }],
                }
            );
            return next;
        });
    }, []);

    const handleAddSection = () => {
        const name = `Section ${sections.length + 1}`;
        setSections((prev) => {
            const next = [
                ...prev,
                { id: uid(), name, rows: [] },
            ];
            return next;
        });
    };

    return (
        <div>
            {sections.map((sec) => (
                <MaterialTable
                    key={sec.id}
                    section={sec}
                    onRowChange={handleRowChange}
                    onRowDelete={handleRowDelete}
                    onRowUpdate={handleRowUpdate}
                    onAddRow={handleAddRow}
                    onSectionDelete={handleDeleteSection}
                    projectData={projectData}
                />
            ))}

            <button
                className="btn btn-sm mt-3"
                style={{ backgroundColor: 'transparent', color: 'var(--app-text-primary)', border: '1px solid var(--app-border-mid)', transition: 'background-color 0.2s', fontWeight: 500 }}
                onClick={handleAddSection}
                onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--app-bg-alt)'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
            >
                + Add Component Section
            </button>
        </div>
    );
};

export default Foundation;
