import { useState, useCallback, useRef, useEffect } from 'react';
import { useProjectData } from '../../../contexts/ProjectDataContext';
import { normalizeBridgeData } from '../../../utils/projectPageSchema';
import './BridgeData.css';

// ── Constants ────────────────────────────────────────────────────────────────

const BRIDGE_TYPES = [
    'Girder',
    'Arch',
    'Cable-Stayed',
    'Suspension',
    'Truss',
    'Box Girder',
    'Slab',
    'Other',
];

// Initial form state
const INITIAL_STATE = {
    bridge_name: '',
    user_agency: '',
    project_country: 'INDIA',
    location: '',
    bridge_type: '',
    span: 0,
    carriageway_width: 0,
    num_lanes: 0,
    vehicle_path_direction: '',
    footpath: '',
    design_life: 0,
    analysis_period: 0,
    year_of_construction: new Date().getFullYear(),
    duration_construction_months: 0,
    working_days_per_month: 22,
    days_per_month: 30,
};

// Required field keys (mirrors Python required=True fields)
const REQUIRED_KEYS = new Set([
    'design_life',
    'analysis_period',
    'year_of_construction',
    'duration_construction_months',
]);

// ── Styles are in BridgeData.css ─────────────────────────────────────────────

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title }) {
    return (
        <h5 className="mb-4 fw-bold pb-2 mt-4" style={{ borderBottom: '1px solid var(--app-border-dark)', fontSize: '1rem', color: 'var(--app-text-primary)', transition: 'all 0.3s' }}>
            {title}
        </h5>
    );
}

function FieldHint({ text }) {
    return (
        <div style={{ fontSize: '0.8rem', color: 'var(--app-text-muted)', marginBottom: '8px' }}>
            {text}
        </div>
    );
}

function TextField({ id, label, hint, required, value, onChange, readOnly = false }) {
    return (
        <div className="mb-4">
            <label htmlFor={id} className="fw-bold mb-1 d-block" style={{ fontSize: '0.9rem', color: 'var(--app-text-secondary)', transition: 'color 0.3s' }}>
                {label}{required && <span className="text-danger"> *</span>}
            </label>
            <FieldHint text={hint} />
            <input
                id={id}
                type="text"
                value={value}
                onChange={(e) => onChange?.(id, e.target.value)}
                className="form-control"
                readOnly={readOnly}
                disabled={readOnly}
            />
        </div>
    );
}

function SelectField({ id, label, hint, required, options, value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const select = (opt) => {
        onChange(id, opt);
        setOpen(false);
    };

    return (
        <div className="mb-4">
            <label className="fw-bold mb-1 d-block" style={{ fontSize: '0.9rem', color: 'var(--app-text-secondary)', transition: 'color 0.3s' }}>
                {label}{required && <span className="text-danger"> *</span>}
            </label>
            <FieldHint text={hint} />
            <div className="position-relative" ref={ref}>
                <button
                    type="button"
                    id={id}
                    className="form-control d-flex align-items-center justify-content-between text-start"
                    onClick={() => setOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                >
                    <span className={value ? '' : 'text-muted fst-italic'}>
                        {value || '— Select —'}
                    </span>
                    <span className="text-muted ms-2" style={{ fontSize: '0.75rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>▾</span>
                </button>
                {open && (
                    <ul className="dropdown-menu show w-100 p-1 shadow-sm overflow-y-auto" role="listbox" style={{ maxHeight: '250px', backgroundColor: 'var(--app-bg-card)', borderColor: 'var(--app-input-border)' }}>
                        <li
                            className="dropdown-item text-muted fst-italic"
                            style={{ cursor: 'pointer', fontSize: '0.875rem' }}
                            onClick={() => select('')}
                        >
                            — Select —
                        </li>
                        {options.map((opt) => (
                            <li
                                key={opt}
                                role="option"
                                aria-selected={value === opt}
                                className={`dropdown-item ${value === opt ? 'active fw-bold' : ''}`}
                                style={{
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    backgroundColor: value === opt ? 'var(--app-accent-bg, rgba(115, 165, 175, 0.15))' : 'transparent',
                                    color: value === opt ? 'var(--app-primary-accent)' : 'var(--app-text-primary)'
                                }}
                                onClick={() => select(opt)}
                                onMouseEnter={(e) => { if (value !== opt) e.target.style.backgroundColor = 'var(--app-bg-alt)'; }}
                                onMouseLeave={(e) => { if (value !== opt) e.target.style.backgroundColor = 'transparent'; }}
                            >
                                {opt}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function NumberField({ id, label, hint, required, min, max, step, unit, value, onChange }) {
    return (
        <div className="mb-4">
            <label htmlFor={id} className="fw-bold mb-1 d-block" style={{ fontSize: '0.9rem', color: 'var(--app-text-secondary)', transition: 'color 0.3s' }}>
                {label}{required && <span className="text-danger"> *</span>}
            </label>
            <FieldHint text={hint} />
            <div className="input-group">
                <input
                    id={id}
                    type="number"
                    min={min}
                    max={max}
                    step={step || 1}
                    value={value}
                    onChange={(e) => onChange(id, e.target.value)}
                    className="form-control"
                />
                {unit && (
                    <span className="input-group-text border-start-0" style={{ fontSize: '0.8rem', backgroundColor: 'var(--app-input-bg)', borderColor: 'var(--app-input-border)' }}>
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

const BridgeData = ({ controller }) => {
    const { projectData, updateProjectData } = useProjectData();
    const projectCountry = projectData.general_info?.project_country || projectData.country || 'INDIA';
    const projectMeta = {
        country: projectCountry,
        general_info: { project_country: projectCountry },
    };
    const [form, setForm] = useState(() => {
        return normalizeBridgeData(projectData.bridge_data, projectMeta);
    });

    useEffect(() => {
        const next = normalizeBridgeData(projectData.bridge_data, {
            country: projectCountry,
            general_info: { project_country: projectCountry },
        });
        // Project imports can replace context data while this page remains mounted.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm(prev => JSON.stringify(next) !== JSON.stringify(prev) ? next : prev);
    }, [projectData.bridge_data, projectCountry]);


    // Sync form to context whenever it changes (updateProjectData is stable via useCallback)
    useEffect(() => {
        updateProjectData('bridge_data', form);
    }, [form, updateProjectData]);

    // ── Handlers ────────────────────────────────────────────────────────────────

    const handleChange = useCallback((key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleClearAll = () => {
        const cleared = normalizeBridgeData(
            { ...INITIAL_STATE, project_country: form.project_country },
            projectMeta,
        );
        setForm(cleared);
        updateProjectData('bridge_data', cleared);
        controller?.engine?._log('Bridge: All fields cleared.');
    };

    // ── Render ───────────────────────────────────────────────────────────────────

    return (
        <div style={{ padding: '24px', color: 'var(--app-text-primary)' }}>
            {/* ── Bridge Identification ───────────────────────────────────────── */}
            <SectionHeader title="Bridge Identification" />

            <TextField
                id="bridge_name"
                label="Name of the Bridge"
                hint=""
                value={form.bridge_name}
                onChange={handleChange}
            />

            <TextField
                id="user_agency"
                label="Owner"
                hint="Name of the owner, client, or responsible agency for this bridge."
                value={form.user_agency}
                onChange={handleChange}
            />

            {/* ── Location ───────────────────────────────────────────────────── */}
            <SectionHeader title="Location" />

            <TextField
                id="project_country"
                label="Country"
                hint="Country in which the bridge is situated."
                value={form.project_country}
                readOnly
            />

            <TextField
                id="location"
                label="Bridge Alignment & Location"
                hint="Bridge start point, end point, crossed feature, and nearby landmarks or route details."
                value={form.location}
                onChange={handleChange}
            />

            {/* ── Technical Specifications ────────────────────────────────────── */}
            <SectionHeader title="Technical Specifications" />

            <SelectField
                id="bridge_type"
                label="Type of Bridge"
                hint="Structural classification of the bridge (e.g. Girder, Arch, Cable-stayed)."
                options={BRIDGE_TYPES}
                value={form.bridge_type}
                onChange={handleChange}
            />

            <NumberField
                id="span"
                label="Span"
                hint="Total span length of the bridge between supports."
                min={0}
                max={99999}
                step={0.01}
                unit="(m)"
                value={form.span}
                onChange={handleChange}
            />

            <NumberField
                id="carriageway_width"
                label="Carriageway Width"
                hint="Clear width of the roadway portion of the bridge deck."
                min={0}
                max={9999}
                step={0.01}
                unit="(m)"
                value={form.carriageway_width}
                onChange={handleChange}
            />

            <NumberField
                id="num_lanes"
                label="Number of Lanes"
                hint="Total number of traffic lanes on the bridge deck."
                min={0}
                max={50}
                value={form.num_lanes}
                onChange={handleChange}
            />

            <SelectField
                id="vehicle_path_direction"
                label="Vehicle Path Direction"
                hint="Indicates whether the road allows one-way or two-way traffic."
                options={['One Way', 'Two Way']}
                value={form.vehicle_path_direction}
                onChange={handleChange}
            />

            <SelectField
                id="footpath"
                label="Footpath"
                hint="Indicates whether a dedicated pedestrian footpath is provided."
                options={['No footpath', 'Footpath at one side', 'Footpath at both sides']}
                value={form.footpath}
                onChange={handleChange}
            />

            {/* ── Life Cycle ──────────────────────────────────────────────────── */}
            <SectionHeader title="Life Cycle" />

            <NumberField
                id="design_life"
                label="Design Life"
                hint="Expected operation or service life of the bridge structure."
                required
                min={0}
                max={999}
                unit="(years)"
                value={form.design_life}
                onChange={handleChange}
            />

            <NumberField
                id="analysis_period"
                label="Analysis Period"
                hint="Total time horizon used for life cycle cost evaluation."
                required
                min={0}
                max={999}
                unit="(years)"
                value={form.analysis_period}
                onChange={handleChange}
            />

            <NumberField
                id="year_of_construction"
                label="Year of Construction"
                hint="Year the bridge was or is planned to be constructed."
                required
                min={2000}
                max={2500}
                value={form.year_of_construction}
                onChange={handleChange}
            />

            {/* ── Construction Schedule ─────────────────────────────────────── */}
            <SectionHeader title="Construction Schedule" />

            <NumberField
                id="duration_construction_months"
                label="Duration of Construction"
                hint="Construction duration expressed in months."
                required
                min={0}
                max={1200}
                unit="(months)"
                value={form.duration_construction_months}
                onChange={handleChange}
            />

            <NumberField
                id="working_days_per_month"
                label="Working Days per Month"
                hint="Number of working days assumed per month for scheduling purposes."
                min={0}
                max={31}
                unit="(days)"
                value={form.working_days_per_month}
                onChange={handleChange}
            />

            <NumberField
                id="days_per_month"
                label="Days Per Month"
                hint="Calendar days per month during which traffic is affected."
                min={0}
                max={31}
                unit="(days)"
                value={form.days_per_month}
                onChange={handleChange}
            />

            {/* ── Buttons ─────────────────────────────────────────────────────── */}
            <div className="d-flex gap-2 mt-4 mb-3">
                <button
                    type="button"
                    className="btn w-100"
                    style={{ backgroundColor: 'var(--app-bg-alt)', color: 'var(--app-text-secondary)', border: '1px solid var(--app-border-mid)', borderRadius: 'var(--app-radius-sm)', transition: 'all 0.2sease' }}
                    onClick={handleClearAll}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--app-border-light)'; e.currentTarget.style.color = 'var(--app-text-primary)'; e.currentTarget.style.borderColor = 'var(--app-border-dark)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--app-bg-alt)'; e.currentTarget.style.color = 'var(--app-text-secondary)'; e.currentTarget.style.borderColor = 'var(--app-border-mid)'; }}
                >
                    Clear All
                </button>
            </div>

        </div>
    );
};

// Expose validate on the component ref if needed externally
export { BridgeData as default };
export { REQUIRED_KEYS, INITIAL_STATE };
