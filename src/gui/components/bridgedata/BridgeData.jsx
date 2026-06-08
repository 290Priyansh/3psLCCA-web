import React, { useState, useCallback, useRef, useEffect } from 'react';
import { data as countriesData } from '../utils/countriesdata';
import { useProjectData } from '../../../contexts/ProjectDataContext';
import { normalizeBridgeData, validateBridgeData } from '../../../utils/projectPageSchema';
import './BridgeData.css';

// ── Constants ────────────────────────────────────────────────────────────────

const BASE_DOCS_URL = 'https://yourdocs.com/bridge/';

const COUNTRIES = countriesData.map((c) => c.COUNTRY);

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
    location_country: '',
    location_address: '',
    location_from: '',
    location_via: '',
    location_to: '',
    bridge_type: '',
    span: '',
    num_lanes: '',
    footpath: '',
    wind_speed: '',
    carriageway_width: '',
    year_of_construction: '',
    duration_construction_months: '',
    working_days_per_month: '',
    design_life: '',
    service_life: '',
};

// Required field keys (mirrors Python required=True fields)
const REQUIRED_KEYS = new Set([
    'bridge_name',
    'user_agency',
    'location_country',
    'bridge_type',
    'span',
    'num_lanes',
    'footpath',
    'wind_speed',
    'carriageway_width',
    'year_of_construction',
    'design_life',
    'service_life',
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

function TextField({ id, label, hint, required, value, onChange, hasError }) {
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
                onChange={(e) => onChange(id, e.target.value)}
                className={`form-control ${hasError ? 'is-invalid' : ''}`}
            />
        </div>
    );
}

function SelectField({ id, label, hint, docSlug, required, options, value, onChange, hasError }) {
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
            <FieldHint text={hint} docSlug={docSlug} />
            <div className="position-relative" ref={ref}>
                <button
                    type="button"
                    id={id}
                    className={`form-control d-flex align-items-center justify-content-between text-start ${hasError ? 'is-invalid' : ''}`}
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

function NumberField({ id, label, hint, required, min, max, step, unit, value, onChange, hasError }) {
    return (
        <div className="mb-4">
            <label htmlFor={id} className="fw-bold mb-1 d-block" style={{ fontSize: '0.9rem', color: 'var(--app-text-secondary)', transition: 'color 0.3s' }}>
                {label}{required && <span className="text-danger"> *</span>}
            </label>
            <FieldHint text={hint} />
            <div className={`input-group ${hasError ? 'is-invalid' : ''}`}>
                <input
                    id={id}
                    type="number"
                    min={min}
                    max={max}
                    step={step || 1}
                    value={value}
                    onChange={(e) => onChange(id, e.target.value)}
                    className={`form-control ${hasError ? 'is-invalid' : ''}`}
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
    const [form, setForm] = useState(() => {
        const saved = projectData.bridge_data;
        return normalizeBridgeData((saved && Object.keys(saved).length > 0) ? { ...INITIAL_STATE, ...saved } : INITIAL_STATE);
    });
    const [errors, setErrors] = useState(new Set());
    const [validationMsg, setValidationMsg] = useState('');

    useEffect(() => {
        const next = normalizeBridgeData({ ...INITIAL_STATE, ...(projectData.bridge_data || {}) });
        setForm(prev => JSON.stringify(next) !== JSON.stringify(prev) ? next : prev);
    }, [projectData.bridge_data]);


    // Sync form to context whenever it changes (updateProjectData is stable via useCallback)
    useEffect(() => {
        updateProjectData('bridge_data', form);
    }, [form, updateProjectData]);

    // ── Handlers ────────────────────────────────────────────────────────────────

    const handleChange = useCallback((key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        // Clear error on edit
        setErrors(prev => {
            if (!prev.has(key)) return prev;
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
        setValidationMsg('');
    }, []);

    const handleClearAll = () => {
        setForm(INITIAL_STATE);
        updateProjectData('bridge_data', INITIAL_STATE);
        setErrors(new Set());
        setValidationMsg('');
        controller?.engine?._log('Bridge: All fields cleared.');
    };

    // ── Validation ───────────────────────────────────────────────────────────────

    const validate = () => {
        const messages = validateBridgeData(form);
        const newErrors = new Set();
        REQUIRED_KEYS.forEach((key) => {
            if (messages.some((message) => message.includes(key.replace(/_/g, ' ')))) newErrors.add(key);
        });

        setErrors(newErrors);
        if (newErrors.size > 0) {
            const msg = `Bridge data needs attention: ${messages.join(' ')}`;
            setValidationMsg(msg);
            controller?.engine?._log(msg);
            return { valid: false, errors: messages };
        }

        setValidationMsg('');
        return { valid: true, errors: [] };
    };

    const hasError = (key) => errors.has(key);

    // ── Render ───────────────────────────────────────────────────────────────────

    return (
        <div style={{ padding: '24px', color: 'var(--app-text-primary)' }}>
            {/* ── Bridge Identification ───────────────────────────────────────── */}
            <SectionHeader title="Bridge Identification" />

            <TextField
                id="bridge_name"
                label="Name of Bridge"
                hint="The official or commonly used name identifying the bridge."
                docSlug="bridge-name"
                required
                value={form.bridge_name}
                onChange={handleChange}
                hasError={hasError('bridge_name')}
            />

            <TextField
                id="user_agency"
                label="Owner"
                hint="Name of the owner, client, or responsible agency for this bridge."
                docSlug="user-agency"
                required
                value={form.user_agency}
                onChange={handleChange}
                hasError={hasError('user_agency')}
            />

            {/* ── Location ───────────────────────────────────────────────────── */}
            <SectionHeader title="Location" />

            <SelectField
                id="location_country"
                label="Country"
                hint="Country in which the bridge is situated."
                docSlug="location-country"
                required
                options={COUNTRIES}
                value={form.location_country}
                onChange={handleChange}
                hasError={hasError('location_country')}
            />

            <TextField
                id="location_address"
                label="Address"
                hint="Full address or site description of the bridge location."
                docSlug="location-address"
                value={form.location_address}
                onChange={handleChange}
                hasError={hasError('location_address')}
            />

            <TextField
                id="location_from"
                label="From"
                hint="Starting point of the bridge (city, road name, landmark, or coordinates)."
                docSlug="location-from"
                value={form.location_from}
                onChange={handleChange}
                hasError={hasError('location_from')}
            />

            <TextField
                id="location_via"
                label="Via"
                hint="Intermediate feature crossed by the bridge (e.g., river, valley, railway, highway)."
                docSlug="location-via"
                value={form.location_via}
                onChange={handleChange}
                hasError={hasError('location_via')}
            />

            <TextField
                id="location_to"
                label="To"
                hint="Ending point of the bridge (city, road name, landmark, or coordinates)."
                docSlug="location-to"
                value={form.location_to}
                onChange={handleChange}
                hasError={hasError('location_to')}
            />

            {/* ── Technical Specifications ────────────────────────────────────── */}
            <SectionHeader title="Technical Specifications" />

            <SelectField
                id="bridge_type"
                label="Type of Bridge"
                hint="Structural classification of the bridge (e.g. Girder, Arch, Cable-stayed)."
                docSlug="bridge-type"
                required
                options={BRIDGE_TYPES}
                value={form.bridge_type}
                onChange={handleChange}
                hasError={hasError('bridge_type')}
            />

            <NumberField
                id="span"
                label="Span"
                hint="Total span length of the bridge between supports."
                docSlug="span"
                required
                min={0}
                max={99999}
                step={0.01}
                unit="(m)"
                value={form.span}
                onChange={handleChange}
                hasError={hasError('span')}
            />

            <NumberField
                id="num_lanes"
                label="Number of Lanes"
                hint="Total number of traffic lanes on the bridge deck."
                docSlug="num-lanes"
                required
                min={0}
                max={20}
                value={form.num_lanes}
                onChange={handleChange}
                hasError={hasError('num_lanes')}
            />

            <SelectField
                id="footpath"
                label="Footpath"
                hint="Indicates whether a dedicated pedestrian footpath is provided."
                required
                options={['Yes', 'No']}
                value={form.footpath}
                onChange={handleChange}
                hasError={hasError('footpath')}
            />

            <NumberField
                id="wind_speed"
                label="Wind Speed"
                hint="Design wind speed used for structural analysis at the bridge site."
                required
                min={0}
                max={999}
                step={0.01}
                unit="(m/s)"
                value={form.wind_speed}
                onChange={handleChange}
                hasError={hasError('wind_speed')}
            />

            <NumberField
                id="carriageway_width"
                label="Carriageway Width"
                hint="Clear width of the roadway portion of the bridge deck."
                required
                min={0}
                max={9999}
                step={0.01}
                unit="(m)"
                value={form.carriageway_width}
                onChange={handleChange}
                hasError={hasError('carriageway_width')}
            />

            {/* ── Timeline ────────────────────────────────────────────────────── */}
            <SectionHeader title="Timeline" />

            <NumberField
                id="year_of_construction"
                label="Year of Construction / Present Year"
                hint="Year the bridge was (or is planned to be) constructed, used as the baseline for life cycle cost assessment."
                required
                min={1900}
                max={2200}
                value={form.year_of_construction}
                onChange={handleChange}
                hasError={hasError('year_of_construction')}
            />

            <NumberField
                id="duration_construction_months"
                label="Duration of Construction"
                hint="Construction duration expressed in months."
                min={0}
                max={1200}
                unit="(months)"
                value={form.duration_construction_months}
                onChange={handleChange}
                hasError={hasError('duration_construction_months')}
            />

            <NumberField
                id="working_days_per_month"
                label="Working Days per Month"
                hint="Number of working days assumed per month for scheduling purposes."
                docSlug="working-days-per-month"
                min={0}
                max={31}
                unit="(days)"
                value={form.working_days_per_month}
                onChange={handleChange}
                hasError={hasError('working_days_per_month')}
            />

            {/* ── Life Cycle ──────────────────────────────────────────────────── */}
            <SectionHeader title="Life Cycle" />

            <NumberField
                id="design_life"
                label="Design Life"
                hint="Expected operational lifetime of the bridge structure."
                docSlug="design-life"
                required
                min={0}
                max={999}
                unit="(years)"
                value={form.design_life}
                onChange={handleChange}
                hasError={hasError('design_life')}
            />

            <NumberField
                id="service_life"
                label="Service Life"
                hint="Actual or anticipated years the bridge remains in serviceable condition."
                docSlug="service-life"
                required
                min={0}
                max={999}
                unit="(years)"
                value={form.service_life}
                onChange={handleChange}
                hasError={hasError('service_life')}
            />

            {/* ── Buttons ─────────────────────────────────────────────────────── */}
            <div className="d-flex gap-2 mt-4 mb-3">
                <button
                    className="btn w-100"
                    style={{ backgroundColor: 'var(--app-bg-alt)', color: 'var(--app-text-secondary)', border: '1px solid var(--app-border-mid)', borderRadius: 'var(--app-radius-sm)', transition: 'all 0.2sease' }}
                    onClick={handleClearAll}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--app-border-light)'; e.currentTarget.style.color = 'var(--app-text-primary)'; e.currentTarget.style.borderColor = 'var(--app-border-dark)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--app-bg-alt)'; e.currentTarget.style.color = 'var(--app-text-secondary)'; e.currentTarget.style.borderColor = 'var(--app-border-mid)'; }}
                >
                    Clear All
                </button>
            </div>

            {/* Validation message */}
            {validationMsg && (
                <div className="alert alert-danger p-2" style={{ fontSize: '0.8rem' }} role="alert">
                    ΓÜá {validationMsg}
                </div>
            )}
        </div>
    );
};

// Expose validate on the component ref if needed externally
export { BridgeData as default };
export { REQUIRED_KEYS, INITIAL_STATE };
