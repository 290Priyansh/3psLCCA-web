import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import { useProjectData } from '../../../contexts/ProjectDataContext';

const VEHICLE_PRESETS = [
    { name: "Light Commercial Vehicle (LCV)", capacity: 3.5, gross_weight: 7.5, empty_weight: 4.0, emission_factor: 0.8, class_label: "Small Truck" },
    { name: "Medium Commercial Vehicle (MCV)", capacity: 10.0, gross_weight: 16.0, empty_weight: 6.0, emission_factor: 1.2, class_label: "Medium Truck" },
    { name: "Heavy Commercial Vehicle (HCV)", capacity: 25.0, gross_weight: 35.0, empty_weight: 10.0, emission_factor: 1.8, class_label: "Heavy Truck" },
];

const AddDeliveryModal = ({ isOpen, onClose, onSave, initialData, controller }) => {
    const { projectData } = useProjectData();
    const [vehicle, setVehicle] = useState(VEHICLE_PRESETS[0]);
    const [route, setRoute] = useState({ origin: '', distance_km: 0 });
    const [allMaterials, setAllMaterials] = useState([]);
    const [selectedMaterialIds, setSelectedMaterialIds] = useState(new Set());

    useEffect(() => {
        const STRUCTURE_CHUNKS = [
            ['foundation_data', 'Foundation'],
            ['substructure_data', 'Sub Structure'],
            ['superstructure_data', 'Super Structure'],
            ['miscellaneous_data', 'Miscellaneous']
        ];

        let mats = [];
        STRUCTURE_CHUNKS.forEach(([chunkId, category]) => {
            const sections = projectData[chunkId] || [];
            sections.forEach(section => {
                const items = section.rows || [];
                items.forEach(item => {
                    mats.push({
                        id: item.id,
                        name: item.workName || 'Unnamed',
                        category: category,
                        quantity: parseFloat(item.qty || 0),
                        unit: item.unit || '',
                        kgFactor: 1.0 // This could be inferred from the unit if needed
                    });
                });
            });
        });
        setAllMaterials(mats);

        if (initialData) {
            setVehicle(initialData.vehicle || VEHICLE_PRESETS[0]);
            setRoute(initialData.route || { origin: '', distance_km: 0 });
            setSelectedMaterialIds(new Set((initialData.selectedMaterials || []).map(m => m.id)));
        }
    }, [isOpen, initialData, projectData]);

    const handleSave = () => {
        const selectedMaterials = allMaterials.filter(m => selectedMaterialIds.has(m.id));
        onSave({
            vehicle,
            route,
            selectedMaterials
        });
    };

    const toggleMaterial = (id) => {
        const next = new Set(selectedMaterialIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedMaterialIds(next);
    };

    return (
        <Modal show={isOpen} onHide={onClose} size="lg" centered contentClassName="border-0" style={{ '--bs-modal-bg': 'var(--app-bg-card)', color: 'var(--app-text-primary)' }}>
            <Modal.Header closeButton className="border-0" style={{ borderBottom: '1px solid var(--app-border-light)' }}>
                <Modal.Title style={{ fontSize: '1.1rem' }}>{initialData ? 'Edit Delivery' : 'Add New Delivery'}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="custom-scrollbar overflow-y-auto" style={{ maxHeight: '70vh' }}>
                <Form>
                    <div className="row g-3 mb-4">
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label className="small text-secondary fw-bold">Vehicle Type</Form.Label>
                                <Form.Select 
                                    style={{ backgroundColor: 'var(--app-bg-main)', color: 'var(--app-text-primary)', borderColor: 'var(--app-border-mid)' }}
                                    value={vehicle.name}
                                    onChange={(e) => setVehicle(VEHICLE_PRESETS.find(v => v.name === e.target.value))}
                                >
                                    {VEHICLE_PRESETS.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className="col-md-3">
                            <Form.Group>
                                <Form.Label className="small text-secondary fw-bold">Origin</Form.Label>
                                <Form.Control 
                                    style={{ backgroundColor: 'var(--app-bg-main)', color: 'var(--app-text-primary)', borderColor: 'var(--app-border-mid)' }}
                                    value={route.origin}
                                    onChange={(e) => setRoute({ ...route, origin: e.target.value })}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-3">
                            <Form.Group>
                                <Form.Label className="small text-secondary fw-bold">Distance (km)</Form.Label>
                                <Form.Control 
                                    type="number"
                                    style={{ backgroundColor: 'var(--app-bg-main)', color: 'var(--app-text-primary)', borderColor: 'var(--app-border-mid)' }}
                                    value={route.distance_km}
                                    onChange={(e) => setRoute({ ...route, distance_km: e.target.value })}
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="mb-2 small text-secondary fw-bold">Vehicle Specifications</div>
                    <div className="p-3 rounded border border-secondary mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <div className="row g-3 text-center">
                            <div className="col-3">
                                <div className="tiny text-muted mb-1">CAPACITY</div>
                                <div className="fw-bold">{vehicle.capacity} T</div>
                            </div>
                            <div className="col-3">
                                <div className="tiny text-muted mb-1">GROSS WT</div>
                                <div className="fw-bold">{vehicle.gross_weight} T</div>
                            </div>
                            <div className="col-3">
                                <div className="tiny text-muted mb-1">EMPTY WT</div>
                                <div className="fw-bold">{vehicle.empty_weight} T</div>
                            </div>
                            <div className="col-3">
                                <div className="tiny text-muted mb-1">EMISSION FACTOR</div>
                                <div className="fw-bold text-success">{vehicle.emission_factor} <small>kg/T-km</small></div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-2 small text-secondary fw-bold">Select Materials for this Delivery</div>
                    <div className="border rounded overflow-hidden" style={{ borderColor: 'var(--app-border-mid)' }}>
                        <Table hover variant="dark" className="mb-0" style={{ fontSize: '0.82rem', '--bs-table-bg': 'var(--app-bg-main)', '--bs-table-color': 'var(--app-text-primary)', '--bs-table-hover-bg': 'var(--app-surface-pressed)' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }} className="text-center">#</th>
                                    <th>Material</th>
                                    <th>Category</th>
                                    <th className="text-end">Weight (T)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allMaterials.map((m) => (
                                    <tr 
                                        key={m.id} 
                                        onClick={() => toggleMaterial(m.id)}
                                        style={{ cursor: 'pointer', backgroundColor: selectedMaterialIds.has(m.id) ? 'rgba(154, 220, 50, 0.1)' : 'transparent' }}
                                    >
                                        <td className="text-center">
                                            <Form.Check readOnly checked={selectedMaterialIds.has(m.id)} />
                                        </td>
                                        <td>{m.name}</td>
                                        <td className="text-muted">{m.category}</td>
                                        <td className="text-end font-monospace">{(m.quantity * m.kgFactor / 1000).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {allMaterials.length === 0 && (
                                    <tr><td colSpan="4" className="text-center py-4 text-secondary">No materials found in project</td></tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-secondary">
                <Button variant="outline-secondary" size="sm" onClick={onClose}>Cancel</Button>
                <Button 
                    variant="primary" 
                    size="sm" 
                    className="fw-bold"
                    onClick={handleSave} 
                    style={{ backgroundColor: 'var(--app-primary-accent)', color: 'var(--app-bg-card)', border: 'none' }}
                >
                    Save Delivery
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

const TransportationEmissions = ({ controller }) => {
    const { projectData, updateProjectData } = useProjectData();
    const [deliveries, setDeliveries] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDelivery, setEditingDelivery] = useState(null);

    useEffect(() => {
        const carbonData = projectData.carbon_emission_data || {};
        const transportData = carbonData.transport_emissions_data || {};
        setDeliveries(transportData.raw_ui_entries || []);
    }, [projectData]);

    const handleAddDelivery = () => {
        setEditingDelivery(null);
        setIsModalOpen(true);
    };

    const handleEditDelivery = (delivery, index) => {
        setEditingDelivery({ ...delivery, index });
        setIsModalOpen(true);
    };

    const handleDeleteDelivery = (index) => {
        const updated = deliveries.filter((_, i) => i !== index);
        setDeliveries(updated);
        saveToEngine(updated);
    };

    const handleSaveDelivery = (delivery) => {
        let updated;
        if (editingDelivery !== null && editingDelivery.index !== undefined) {
             updated = [...deliveries];
             updated[editingDelivery.index] = delivery;
        } else {
            updated = [...deliveries, delivery];
        }
        setDeliveries(updated);
        setIsModalOpen(false);
        saveToEngine(updated);
    };

    const saveToEngine = (updatedDeliveries) => {
        const computed = computeEmissions(updatedDeliveries);
        const prev = projectData.carbon_emission_data || {};
        updateProjectData('carbon_emission_data', {
            ...prev,
            transport_emissions_data: {
                ...computed,
                raw_ui_entries: updatedDeliveries
            }
        });
    };

    const computeEmissionsForSingle = (entry) => {
        const v = entry.vehicle || {};
        const r = entry.route || {};
        const cap = parseFloat(v.capacity || 0);
        const gross = parseFloat(v.gross_weight || 0);
        const empty = parseFloat(v.empty_weight || 0);
        const dist = parseFloat(r.distance_km || 0);
        const ef = parseFloat(v.emission_factor || 0);
        
        const totalWeightT = (entry.selectedMaterials || []).reduce((sum, m) => sum + (parseFloat(m.quantity || 0) * (m.kgFactor || 1) / 1000), 0);
        const trips = cap > 0 ? Math.ceil(totalWeightT / cap) : 0;
        return (gross + empty) * trips * dist * ef;
    };

    const computeEmissions = (entries) => {
        let totalEmission = 0;
        const processedEntries = entries.map(entry => {
            const emission = computeEmissionsForSingle(entry);
            totalEmission += emission;
            return {
                vehicle_name: entry.vehicle?.name,
                origin: entry.route?.origin,
                distance_km: entry.route?.distance_km,
                emission_kgCO2e: emission,
                materials: entry.selectedMaterials
            };
        });

        return {
            entries: processedEntries,
            total_kgCO2e: totalEmission,
            active_vehicle_count: entries.length
        };
    };

    const [showDetails, setShowDetails] = useState(true);

    const totals = useMemo(() => {
        const computed = computeEmissions(deliveries);
        const categorical = {
            'Foundation': 0,
            'Sub Structure': 0,
            'Super Structure': 0,
            'Misc': 0
        };

        deliveries.forEach(delivery => {
            const emission = computeEmissionsForSingle(delivery);
            (delivery.selectedMaterials || []).forEach(m => {
                const mWeight = (parseFloat(m.quantity || 0) * (m.kgFactor || 1) / 1000);
                const mEmission = delivery.vehicle?.emission_factor * delivery.route?.distance_km * (mWeight / (delivery.vehicle?.capacity || 1)); // Rough estimate per material
                if (categorical[m.category] !== undefined) {
                    categorical[m.category] += mEmission;
                } else {
                    categorical['Misc'] += mEmission;
                }
            });
        });

        return {
            total: computed.total_kgCO2e,
            count: deliveries.length,
            categorical
        };
    }, [deliveries]);

    return (
        <div className="transportation-emissions d-flex flex-column h-100" style={{ backgroundColor: 'var(--app-bg-main)', color: 'var(--app-text-primary)' }}>
            <style>{`
                .btn-lime {
                    background-color: var(--app-primary-accent);
                    color: var(--app-bg-card);
                    border: none;
                }
                .btn-lime:hover {
                    background-color: color-mix(in srgb, var(--app-primary-accent) 80%, #fff);
                    color: var(--app-bg-card);
                }
                .transportation-top-summary {
                    background-color: transparent;
                    color: var(--app-text-primary);
                    padding: 8px 16px;
                    border-bottom: 1px solid var(--app-border-light);
                }
                .v-separator {
                    width: 1px;
                    height: 16px;
                    background-color: var(--app-border-light);
                    margin: 0 16px;
                }
                .form-control:focus, .form-select:focus {
                    border-color: var(--app-primary-accent) !important;
                    box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-primary-accent) 25%, transparent) !important;
                    outline: none !important;
                }
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
                .transportation-card {
                    background-color: var(--app-bg-card);
                    border: 1px solid var(--app-border-mid);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 16px;
                }
                .transportation-card-header {
                    background-color: var(--app-bg-alt);
                    padding: 6px 12px;
                    border-bottom: 1px solid var(--app-border-mid);
                }
                .transportation-table th {
                    background-color: var(--app-bg-alt) !important;
                    color: var(--app-text-secondary) !important;
                    font-weight: 500;
                    padding: 4px 8px !important;
                    border: 1px solid var(--app-border-mid) !important;
                }
                .transportation-table td {
                    padding: 4px 8px !important;
                    border: 1px solid var(--app-border-mid) !important;
                }
            `}</style>

            {/* Top Summary Bar */}
            <div className="transportation-top-summary d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-4" style={{ fontSize: '0.82rem' }}>
                    <div className="text-light">
                        Total: <span className="fw-bold">{totals.total.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span> <span className="text-secondary opacity-75">kgCO₂e</span>
                    </div>
                    
                    <div className="text-light">
                        Vehicles: <span className="fw-bold">{totals.count}</span>
                    </div>
                </div>
                
                <button 
                    className="btn btn-sm py-1 px-3 d-flex align-items-center gap-2 border-0"
                    onClick={() => setShowDetails(!showDetails)}
                    style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: 'var(--app-bg-alt)', 
                        color: 'var(--app-text-primary)',
                        borderRadius: '4px',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                >
                    {showDetails ? 'Hide Details ▲' : 'Show Details ▼'}
                </button>
            </div>

            {/* Details Row (only if expanded) */}
            {showDetails && (
                <div className="p-3 border-bottom animate-fade-in" style={{ backgroundColor: 'var(--app-bg-alt)', borderColor: 'var(--app-border-mid)' }}>
                    <table className="transportation-table w-100" style={{ fontSize: '0.78rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--app-bg-alt)' }}>
                                <th className="ps-3" style={{ border: '1px solid var(--app-border-mid)', color: 'var(--app-text-primary)', padding: '8px', fontSize: '0.82rem', fontWeight: '600' }}>Category</th>
                                <th style={{ border: '1px solid var(--app-border-mid)', color: 'var(--app-text-primary)', padding: '8px', fontSize: '0.82rem', fontWeight: '600' }}>kgCO₂e</th>
                                <th style={{ border: '1px solid var(--app-border-mid)', color: 'var(--app-text-primary)', padding: '8px', fontSize: '0.82rem', fontWeight: '600' }}>% of Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(totals.categorical).map(([label, value]) => (
                                <tr key={label} style={{ borderBottom: '1px solid var(--app-border-light)' }}>
                                    <td className="ps-3" style={{ border: '1px solid var(--app-border-light)', color: 'var(--app-text-secondary)', padding: '6px' }}>{label}</td>
                                    <td style={{ border: '1px solid var(--app-border-light)', color: 'var(--app-text-primary)', padding: '6px' }}>{value.toFixed(3)}</td>
                                    <td style={{ border: '1px solid var(--app-border-light)', color: 'var(--app-primary-accent)', padding: '6px' }}>
                                        {totals.total > 0 ? ((value / totals.total) * 100).toFixed(1) : 0}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Action Bar */}
            <div className="p-3 pb-0 d-flex align-items-center">
                <button 
                    className="btn btn-sm py-2 px-3 d-flex align-items-center gap-2 btn-lime"
                    onClick={handleAddDelivery}
                    style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 'bold',
                        color: 'var(--app-bg-card)',
                        borderRadius: '4px'
                    }}
                >
                    <i className="bi bi-plus-lg"></i> Add Delivery
                </button>
            </div>

            <div className="px-3 pt-2 flex-grow-1 overflow-auto custom-scrollbar">
                {deliveries.length === 0 ? (
                    <div className="text-center py-5 rounded-1" style={{ backgroundColor: 'var(--app-bg-card)', border: '1px dashed var(--app-border-mid)' }}>
                        <i className="bi bi-truck text-secondary display-4 mb-3 d-block" style={{ color: 'var(--app-text-muted)' }}></i>
                        <div className="text-secondary mb-3" style={{ color: 'var(--app-text-secondary)' }}>No transportation deliveries configured</div>
                        <button 
                            className="btn btn-sm btn-lime px-3 py-2 fw-bold" 
                            style={{ color: 'var(--app-bg-card)' }} 
                            onClick={handleAddDelivery}
                        >
                            Configure First Delivery
                        </button>
                    </div>
                ) : (
                    <div className="row g-4">
                        {deliveries.map((delivery, index) => {
                            const singleEmission = computeEmissionsForSingle(delivery);
                            return (
                                <div key={index} className="col-12">
                                    <div className="transportation-card">
                                        {/* Header */}
                                        <div className="transportation-card-header d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="bi bi-truck text-secondary" style={{ color: 'var(--app-text-muted)' }}></i>
                                                <span className="fw-bold text-light" style={{ fontSize: '0.82rem' }}>
                                                    {delivery.vehicle?.name} — {delivery.route?.origin} | {delivery.route?.distance_km} km | {singleEmission.toLocaleString(undefined, { maximumFractionDigits: 1 })} kgCO₂e
                                                </span>
                                            </div>
                                            <div className="d-flex gap-1">
                                                <button className="btn btn-sm btn-light border p-1" style={{ width: '28px', backgroundColor: 'var(--app-bg-alt)', borderColor: '#3d3d3d', color: 'var(--app-text-primary)' }} onClick={() => handleEditDelivery(delivery, index)} title="Edit">
                                                    <i className="bi bi-pencil small"></i>
                                                </button>
                                                <button className="btn btn-sm btn-light border p-1 text-danger" style={{ width: '28px', backgroundColor: 'var(--app-bg-alt)', borderColor: '#3d3d3d' }} onClick={() => handleDeleteDelivery(index)} title="Delete">
                                                    <i className="bi bi-trash small"></i>
                                                </button>
                                            </div>
                                        </div>
                                            <div className="p-0" style={{ borderTop: '1px solid var(--app-border-mid)' }}>
                                                {/* Specs Row */}
                                                <div className="d-flex flex-wrap gap-4 px-3 py-2 border-bottom" style={{ fontSize: '0.78rem', backgroundColor: 'var(--app-bg-card)', borderColor: 'var(--app-border-mid)' }}>
                                                    <div><span className="text-secondary opacity-75">Class:</span> <span className="fw-medium text-light">{delivery.vehicle?.class_label}</span></div>
                                                    <div><span className="text-secondary opacity-75">Capacity:</span> <span className="fw-medium text-light">{delivery.vehicle?.capacity} T</span></div>
                                                    <div><span className="text-secondary opacity-75">Gross Wt:</span> <span className="fw-medium text-light">{delivery.vehicle?.gross_weight} T</span></div>
                                                    <div><span className="text-secondary opacity-75">Empty Wt:</span> <span className="fw-medium text-light">{delivery.vehicle?.empty_weight} T</span></div>
                                                    <div><span className="text-secondary opacity-75">EF:</span> <span className="fw-medium text-light">{delivery.vehicle?.emission_factor} kg/km</span></div>
                                                </div>
                                                
                                                {/* Material Table */}
                                                <div className="table-responsive">
                                                    <table className="transportation-table table-sm mb-0 w-100" style={{ fontSize: '0.78rem' }}>
                                                        <thead>
                                                            <tr style={{ backgroundColor: 'var(--app-bg-alt)' }}>
                                                                <th className="ps-3" style={{ border: '1px solid var(--app-border-mid)', color: 'var(--app-text-primary)', padding: '6px' }}>Material</th>
                                                                <th className="text-end" style={{ border: '1px solid var(--app-border-mid)', color: 'var(--app-text-primary)', padding: '6px' }}>Quantity</th>
                                                                <th className="text-end pe-3" style={{ border: '1px solid var(--app-border-mid)', color: 'var(--app-text-primary)', padding: '6px' }}>Weight (T)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {delivery.selectedMaterials?.map((m, mIdx) => (
                                                                <tr key={mIdx}>
                                                                    <td className="ps-3 py-1" style={{ border: '1px solid var(--app-border-mid)', color: 'var(--app-text-secondary)' }}>{m.name} <span className="text-secondary extra-small">({m.category})</span></td>
                                                                    <td className="text-end py-1 font-monospace" style={{ border: '1px solid var(--app-border-mid)', color: 'var(--app-text-primary)' }}>{parseFloat(m.quantity || 0).toLocaleString()} {m.unit}</td>
                                                                    <td className="text-end py-1 pe-3 font-monospace" style={{ border: '1px solid var(--app-border-mid)', color: 'var(--app-text-primary)' }}>
                                                                        {(parseFloat(m.quantity || 0) * (m.kgFactor || 1) / 1000).toFixed(2)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            }
            </div>

            {/* Modals */}
            {isModalOpen && (
                <AddDeliveryModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveDelivery}
                    initialData={editingDelivery}
                    controller={controller}
                />
            )}
        </div>
    );
};

export default TransportationEmissions;