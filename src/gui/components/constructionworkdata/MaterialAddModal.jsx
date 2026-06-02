import React, { useState, useEffect, useMemo, useRef } from 'react';
import darbhangaData from '../utils/material_database/INDIA_Bihar_Darbhanga_2025.json';
import mumbaiData from '../utils/material_database/INDIA_Maharashtra_Mumbai_2023.json';

const DB_MAP = {
    "INDIA/Bihar/Darbhanga-2025": darbhangaData,
    "INDIA/Maharashtra/Mumbai-2023": mumbaiData
};

const UNIT_SELECT_STYLE = {
    backgroundColor: 'var(--app-bg-card)',
    color: 'var(--app-text-primary)',
    borderColor: 'var(--app-border-mid)',
};

function UnitDropdown({ value, onChange }) {
    const handleChange = (e) => {
        if (e.target.value === 'custom_unit_trigger') {
            const customUnit = prompt('Enter custom unit:');
            if (customUnit) onChange(customUnit);
        } else {
            onChange(e.target.value);
        }
    };

    return (
        <select
            className="form-select form-select-sm shadow-none"
            style={UNIT_SELECT_STYLE}
            value={value}
            onChange={handleChange}
        >
            <option value={value} hidden>{value}</option>

            <optgroup label="— Length —">
                <option value="m">m (Metre)</option>
                <option value="mm">mm (Millimetre)</option>
                <option value="cm">cm (Centimetre)</option>
                <option value="km">km (Kilometre)</option>
            </optgroup>

            <optgroup label="— Area —">
                <option value="m²">m² (Square Metre)</option>
                <option value="mm²">mm² (Square Millimetre)</option>
                <option value="cm²">cm² (Square Centimetre)</option>
                <option value="ha">ha (Hectare)</option>
            </optgroup>

            <optgroup label="— Volume —">
                <option value="m³">m³ (Cubic Metre)</option>
                <option value="mL">mL (Millilitre)</option>
                <option value="L">L (Litre)</option>
            </optgroup>

            <optgroup label="— Mass —">
                <option value="kg">kg (Kilogram)</option>
                <option value="t">t (Metric Tonne)</option>
                <option value="q">q (Quintal)</option>
                <option value="g">g (Gram)</option>
            </optgroup>

            <optgroup label="— Count —">
                <option value="Nos.">Nos. (Numbers)</option>
                <option value="Pcs.">Pcs. (Pieces)</option>
                <option value="Set">Set (Set)</option>
                <option value="L.S.">L.S. (Lump Sum)</option>
            </optgroup>

            <optgroup label="— Time —">
                <option value="hr">hr (Hour)</option>
                <option value="day">day (Day)</option>
                <option value="month">month (Month)</option>
                <option value="yr">yr (Year)</option>
            </optgroup>

            <option value="custom_unit_trigger" className="fw-bold" style={{ color: 'var(--app-primary-accent)' }}>
                + Add Custom Unit...
            </option>
        </select>
    );
}

const MaterialAddModal = ({ sectionName, onClose, onAdd, projectData, editData }) => {
    // Robust resolution of the selected database key
    const sorDbKey = projectData?.general_info?.sor_database || projectData?.bridge_data?.sor_database || projectData?.sor_database || '';
    const dbData = DB_MAP[sorDbKey];

    // Basic fields
    const [workName, setWorkName] = useState(editData ? editData.workName : '');
    const [allowEditingDB, setAllowEditingDB] = useState(editData ? !!editData.allowEditingDB : false);
    const [qty, setQty] = useState(editData ? editData.qty : '');
    const [unit, setUnit] = useState(editData ? editData.unit : 'm³ — Cubic Metre');
    const [rate, setRate] = useState(editData ? editData.rate : '');
    const [source, setSource] = useState(editData ? editData.source : '');

    // Carbon Emission
    const [includeCarbon, setIncludeCarbon] = useState(editData ? !!editData.carbonEmission : true);
    const [emissionFactor, setEmissionFactor] = useState(editData?.carbonEmission ? editData.carbonEmission.factor : '');
    const [emissionPerUnit, setEmissionPerUnit] = useState(editData?.carbonEmission ? editData.carbonEmission.perUnit : 'm³ — Cubic Metre');
    const [emissionSource, setEmissionSource] = useState(editData?.carbonEmission ? editData.carbonEmission.source : '');

    // Recyclability
    const [includeRecyclability, setIncludeRecyclability] = useState(editData ? !!editData.recyclability : false);
    const [grade, setGrade] = useState(editData?.recyclability ? editData.recyclability.grade : '');
    const [type, setType] = useState(editData?.recyclability ? editData.recyclability.type : '');

    // Search Suggestions
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const suggestionRef = useRef(null);

    const suggestions = useMemo(() => {
        if (!dbData || !workName || workName.length < 2) return [];

        // GUI-style normalization: Lowercase, replace special chars with spaces, collapse spaces
        const normalize = (text) => {
            if (!text) return "";
            return text.toLowerCase()
                .replace(/[(),\-/]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const tokenize = (text) => {
            const norm = normalize(text);
            return norm ? norm.split(' ') : [];
        };

        // GUI-style token matching: handles concatenated units like "500mm" -> ["500", "mm"]
        const tokenMatches = (tok, itemNorm) => {
            if (itemNorm.includes(tok)) return true;
            const parts = tok.match(/[a-z]+|\d+/g);
            if (parts && parts.length > 1) {
                return parts.every(p => itemNorm.includes(p));
            }
            return false;
        };

        const queryTokens = tokenize(workName);
        if (queryTokens.length === 0) return [];

        const results = [];
        const normSection = sectionName.toLowerCase();

        dbData.forEach(sheet => {
            const sheetNorm = sheet.sheetName.toLowerCase();
            const typeNorm = sheet.type.toLowerCase();

            // Prioritize if section name matches sheet name or type (e.g. "Girders" vs "Girder")
            const isRelevantSection = normSection.includes(sheetNorm) || sheetNorm.includes(normSection) ||
                normSection.includes(typeNorm) || typeNorm.includes(normSection);

            sheet.data.forEach(item => {
                const itemNorm = normalize(item.name);
                const allTokensMatch = queryTokens.every(tok => tokenMatches(tok, itemNorm));

                if (allTokensMatch) {
                    results.push({
                        ...item,
                        sheetName: sheet.sheetName,
                        type: sheet.type,
                        isRelevantSection
                    });
                }
            });
        });

        // Sorting priority:
        // 1. Matches in the current section/type
        // 2. Starts with the query string
        // 3. Shorter names first (usually more general/relevant)
        // 4. Alphabetical
        return results.sort((a, b) => {
            if (a.isRelevantSection && !b.isRelevantSection) return -1;
            if (!a.isRelevantSection && b.isRelevantSection) return 1;

            const aStarts = a.name.toLowerCase().startsWith(workName.toLowerCase());
            const bStarts = b.name.toLowerCase().startsWith(workName.toLowerCase());
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            if (a.name.length !== b.name.length) return a.name.length - b.name.length;

            return a.name.localeCompare(b.name);
        }).slice(0, 50);
    }, [dbData, workName, sectionName]);

    const handleSelectMaterial = (item) => {
        setWorkName(item.name);
        setRate(item.rate);
        setUnit(item.unit);
        setSource(item.rate_src);

        if (item.carbon_emission !== 'not_available') {
            setIncludeCarbon(true);
            setEmissionFactor(item.carbon_emission);
            setEmissionSource(item.carbon_emission_src);
            // Units mapping might be needed if they don't match exactly
            if (item.carbon_emission_units_den === 'cum') setEmissionPerUnit('m³');
            else if (item.carbon_emission_units_den === 'kg') setEmissionPerUnit('kg');
            else if (item.carbon_emission_units_den === 'MT') setEmissionPerUnit('t');
        }

        setShowSuggestions(false);
        setSelectedIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            handleSelectMaterial(suggestions[selectedIndex]);
            e.preventDefault();
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleAdd = () => {
        const newRowData = {
            workName,
            qty: parseFloat(qty) || 0,
            unit,
            rate: parseFloat(rate) || 0,
            source,
            allowEditingDB,
            carbonEmission: includeCarbon ? { factor: parseFloat(emissionFactor) || 0, perUnit: emissionPerUnit, source: emissionSource } : null,
            recyclability: includeRecyclability ? { grade, type } : null
        };
        onAdd(newRowData);
    };

    return (
        <>
            <div className="modal-backdrop fade show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}></div>

            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }} role="dialog">
                <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '800px' }}>
                    <div className="modal-content shadow-lg border-0 overflow-hidden" style={{ backgroundColor: 'var(--app-bg-card)', color: 'var(--app-text-primary)', borderRadius: '8px' }}>

                        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom" style={{ backgroundColor: 'var(--app-bg-alt)', borderColor: 'var(--app-border-mid)' }}>
                            <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--app-primary-accent)', fontSize: '1.2rem' }}>⛁</span>
                                <span>{editData ? 'Edit Material' : 'Add Material'} — {sectionName}</span>
                            </div>
                            <div className="d-flex gap-3 align-items-center" style={{ cursor: 'pointer', fontSize: '1.1rem' }}>
                                <span className="opacity-75" onClick={onClose}>—</span>
                                <span className="opacity-75" onClick={onClose}>□</span>
                                <span onClick={onClose}>✕</span>
                            </div>
                        </div>

                        <div className="modal-body px-4 py-2" style={{ fontSize: '0.9rem' }}>
                            <div className="mb-3 opacity-75" style={{ fontSize: '0.85rem' }}>
                                Suggestions from: <span className="fst-italic">{sorDbKey || '— not set (configure in Project Settings)'}</span>
                            </div>

                            <div className="mb-2 position-relative">
                                <label className="form-label fw-medium mb-1">Material Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="e.g. Ready-mix Concrete M25  (type 2+ chars to search)"
                                    value={workName}
                                    onChange={e => { setWorkName(e.target.value); setShowSuggestions(true); setSelectedIndex(-1); }}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setShowSuggestions(true)}
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul
                                        ref={suggestionRef}
                                        className="list-group position-absolute w-100 shadow-sm"
                                        style={{ zIndex: 1100, maxHeight: '250px', overflowY: 'auto', backgroundColor: 'var(--app-bg-card)', borderColor: 'var(--app-border-mid)' }}
                                    >
                                        {suggestions.map((item, index) => (
                                            <li
                                                key={index}
                                                className={`list-group-item list-group-item-action py-2 border-0 ${selectedIndex === index ? 'active' : ''}`}
                                                style={{
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    backgroundColor: selectedIndex === index ? 'var(--app-primary-accent)' : 'transparent',
                                                    color: selectedIndex === index ? 'white' : 'var(--app-text-primary)'
                                                }}
                                                onClick={() => handleSelectMaterial(item)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                            >
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span>{item.name}</span>
                                                    <span className="badge bg-secondary opacity-50" style={{ fontSize: '0.7rem' }}>{item.type}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="mb-2 form-check d-flex align-items-center gap-2">
                                <input
                                    className="form-check-input mt-0"
                                    type="checkbox"
                                    id="allowDb"
                                    style={{ width: '18px', height: '18px', backgroundColor: allowEditingDB ? 'var(--app-primary-accent)' : 'var(--app-input-bg)', borderColor: 'var(--app-border-mid)' }}
                                    checked={allowEditingDB}
                                    onChange={e => setAllowEditingDB(e.target.checked)}
                                />
                                <label className="form-check-label opacity-75" htmlFor="allowDb" style={{ paddingTop: '1px', cursor: 'pointer' }}>
                                    Allow editing DB-filled values
                                </label>
                            </div>

                            <div className="row mb-2">
                                <div className="col-md-6">
                                    <label className="form-label fw-medium mb-1">Quantity <span className="text-danger">*</span></label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        placeholder="e.g. 100"
                                        value={qty}
                                        onChange={e => setQty(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-medium mb-1">Unit <span className="text-danger">*</span></label>
                                    <UnitDropdown value={unit} onChange={setUnit} />
                                </div>
                            </div>

                            <div className="row mb-2 pb-2 border-bottom border-secondary" style={{ borderColor: 'var(--app-border-mid) !important' }}>
                                <div className="col-md-6">
                                    <label className="form-label fw-medium mb-1">Rate (Cost)</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        placeholder="0.00"
                                        value={rate}
                                        onChange={e => setRate(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-medium mb-1">Rate Source</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="e.g. SOR, Market"
                                        value={source}
                                        onChange={e => setSource(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mb-2 pb-2 border-bottom border-secondary" style={{ borderColor: 'var(--app-border-mid) !important' }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="m-0 fw-bold">Carbon Emission</h6>
                                    <div className="form-check d-flex align-items-center gap-2 m-0">
                                        <input
                                            className="form-check-input mt-0"
                                            type="checkbox"
                                            id="incCarbon"
                                            style={{ width: '18px', height: '18px', backgroundColor: includeCarbon ? 'var(--app-primary-accent)' : 'var(--app-input-bg)', borderColor: 'var(--app-border-mid)' }}
                                            checked={includeCarbon}
                                            onChange={e => setIncludeCarbon(e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="incCarbon" style={{ cursor: 'pointer' }}>Include</label>
                                    </div>
                                </div>
                                <div className="row" style={{ opacity: includeCarbon ? 1 : 0.5, pointerEvents: includeCarbon ? 'auto' : 'none' }}>
                                    <div className="col-md-4">
                                        <label className="form-label mb-1">Emission Factor</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="0.000"
                                            value={emissionFactor}
                                            onChange={e => setEmissionFactor(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label mb-1">Per Unit</label>
                                        <UnitDropdown value={emissionPerUnit} onChange={setEmissionPerUnit} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label mb-1">Source</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="e.g. ICE, IPCC"
                                            value={emissionSource}
                                            onChange={e => setEmissionSource(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-2">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="m-0 fw-bold">Recyclability</h6>
                                    <div className="form-check d-flex align-items-center gap-2 m-0">
                                        <input
                                            className="form-check-input mt-0"
                                            type="checkbox"
                                            id="incRecyclability"
                                            style={{ width: '18px', height: '18px', backgroundColor: includeRecyclability ? 'var(--app-primary-accent)' : 'var(--app-input-bg)', borderColor: 'var(--app-border-mid)' }}
                                            checked={includeRecyclability}
                                            onChange={e => setIncludeRecyclability(e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="incRecyclability" style={{ cursor: 'pointer' }}>Include</label>
                                    </div>
                                </div>
                                <div className="row" style={{ opacity: includeRecyclability ? 1 : 0.5, pointerEvents: includeRecyclability ? 'auto' : 'none' }}>
                                    <div className="col-md-6">
                                        <label className="form-label mb-1">Grade</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="e.g. M25"
                                            value={grade}
                                            onChange={e => setGrade(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label mb-1">Type</label>
                                        <input
                                            className="form-control form-control-sm"
                                            value={type}
                                            onChange={e => setType(e.target.value)}
                                            placeholder="e.g. Concrete"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="modal-footer d-flex justify-content-between border-top border-secondary pt-3 pb-3 px-4" style={{ backgroundColor: 'var(--app-bg-alt)', borderColor: 'var(--app-border-mid) !important' }}>
                            <button className="btn px-4" style={{ backgroundColor: 'transparent', color: 'var(--app-text-primary)', border: '1px solid var(--app-primary-accent)' }}>Save to Custom DB...</button>
                            <div className="d-flex gap-2">
                                <button className="btn px-4" style={{ backgroundColor: 'var(--app-bg-card)', color: 'var(--app-text-primary)', border: '1px solid var(--app-border-mid)' }} onClick={onClose}>Cancel</button>
                                <button className="btn px-4" style={{ backgroundColor: 'var(--app-primary-accent)', color: 'white', border: 'none' }} onClick={handleAdd}>{editData ? 'Save Changes' : 'Add to Table'}</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};

export default MaterialAddModal;