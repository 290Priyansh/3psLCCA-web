import React, { useState } from 'react';
import { Modal, Button, Form, Accordion, Row, Col } from 'react-bootstrap';
import { FaFilePdf, FaCheckSquare, FaSquare } from 'react-icons/fa';

// Mirroring constants from desktop GUI
export const REPORT_SECTIONS = {
    TITLE_PAGE: "Title page",
    INPUT_DATA: "Input data",
    LCCA_RESULTS: "LCCA results",
};

export const SECTION_KEYS = {
    KEY_SHOW_BRIDGE_DESC: "show_bridge_desc",
    KEY_SHOW_FINANCIAL: "show_financial",
    KEY_SHOW_CONSTRUCTION: "show_construction",
    KEY_SHOW_LCC_ASSUMPTIONS: "show_lcc_assumptions",
    KEY_SHOW_USE_STAGE: "show_use_stage",
    KEY_SHOW_AVG_TRAFFIC: "show_avg_traffic",
    KEY_SHOW_ROAD_TRAFFIC: "show_road_traffic",
    KEY_SHOW_PEAK_HOUR: "show_peak_hour",
    KEY_SHOW_HUMAN_INJURY: "show_human_injury",
    KEY_SHOW_VEHICLE_DAMAGE: "show_vehicle_damage",
    KEY_SHOW_TYRE_COST: "show_tyre_cost",
    KEY_SHOW_FUEL_OIL: "show_fuel_oil",
    KEY_SHOW_NEW_VEHICLE: "show_new_vehicle",
    KEY_SHOW_SOCIAL_CARBON: "show_social_carbon",
    KEY_SHOW_MATERIAL_EMISSION: "show_material_emission",
    KEY_SHOW_USE_EMISSION: "show_use_emission",
    KEY_SHOW_VEHICLE_EMISSION: "show_vehicle_emission",
    KEY_SHOW_ONSITE_EMISSION: "show_onsite_emission",
    KEY_SHOW_TRANSPORT_EMISSION: "show_transport_emission",
    KEY_SHOW_TITLE_PAGE: "show_title_page",
    KEY_SHOW_INTRODUCTION: "show_introduction",
    KEY_SHOW_LCCA_RESULTS: "show_lcca_results",
};

const SUBSECTION_MAP = {
    "Bridge geometry and description": [
        { label: "Table 2-1: Bridge description", key: SECTION_KEYS.KEY_SHOW_BRIDGE_DESC },
    ],
    "User note": [
        { label: "Table 2-2: Financial Data", key: SECTION_KEYS.KEY_SHOW_FINANCIAL },
    ],
    "Construction data": [
        { label: "Table 2-3: Construction materials", key: SECTION_KEYS.KEY_SHOW_CONSTRUCTION },
        { label: "Table 2-4: LCC assumptions", key: SECTION_KEYS.KEY_SHOW_LCC_ASSUMPTIONS },
        { label: "Table 2-5: Use stage details", key: SECTION_KEYS.KEY_SHOW_USE_STAGE },
    ],
    "Traffic data": [
        { label: "Table 2-6: Average daily traffic", key: SECTION_KEYS.KEY_SHOW_AVG_TRAFFIC },
        { label: "Table 2-7: Road and traffic data", key: SECTION_KEYS.KEY_SHOW_ROAD_TRAFFIC },
        { label: "Table 2-8: Peak hour distribution", key: SECTION_KEYS.KEY_SHOW_PEAK_HOUR },
        { label: "Table 2-9: Human injury cost", key: SECTION_KEYS.KEY_SHOW_HUMAN_INJURY },
        { label: "Table 2-10: Vehicle damage cost", key: SECTION_KEYS.KEY_SHOW_VEHICLE_DAMAGE },
        { label: "Table 2-11: Tyre cost data", key: SECTION_KEYS.KEY_SHOW_TYRE_COST },
        { label: "Table 2-12: Fuel, oil and grease", key: SECTION_KEYS.KEY_SHOW_FUEL_OIL },
        { label: "Table 2-13: Cost of new vehicle", key: SECTION_KEYS.KEY_SHOW_NEW_VEHICLE },
    ],
    "Environmental input data": [
        { label: "Table 2-14: Social cost of carbon", key: SECTION_KEYS.KEY_SHOW_SOCIAL_CARBON },
        { label: "Table 2-15: Material emission factors", key: SECTION_KEYS.KEY_SHOW_MATERIAL_EMISSION },
        { label: "Table 2-16: Use stage emissions", key: SECTION_KEYS.KEY_SHOW_USE_EMISSION },
        { label: "Table 2-17: Vehicle emission factors", key: SECTION_KEYS.KEY_SHOW_VEHICLE_EMISSION },
        { label: "Table 2-18: On-site emissions", key: SECTION_KEYS.KEY_SHOW_ONSITE_EMISSION },
        { label: "Table 2-19: Transport emissions", key: SECTION_KEYS.KEY_SHOW_TRANSPORT_EMISSION },
    ],
};

const INITIAL_STATE = Object.values(SECTION_KEYS).reduce((acc, key) => {
    acc[key] = true; // Default all to true
    return acc;
}, {});

const ReportSectionModal = ({ show, onHide, onConfirm }) => {
    const [selections, setSelections] = useState(INITIAL_STATE);

    const handleToggle = (key) => {
        setSelections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleToggleGroup = (groupKey, value) => {
        const groupItems = SUBSECTION_MAP[groupKey] || [];
        const newSelections = { ...selections };
        groupItems.forEach(item => {
            newSelections[item.key] = value;
        });
        setSelections(newSelections);
    };

    const handleSelectAll = (value) => {
        const newSelections = {};
        Object.keys(selections).forEach(key => {
            newSelections[key] = value;
        });
        setSelections(newSelections);
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            size="lg" 
            centered
            contentClassName="report-modal-content"
        >
            <Modal.Header closeButton style={{ borderBottom: '1px solid var(--app-border-light)', backgroundColor: 'var(--app-bg-card)' }}>
                <Modal.Title className="d-flex align-items-center" style={{ color: 'var(--app-primary-accent)', gap: '10px' }}>
                    <FaFilePdf /> Report Customization
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overflow-y-auto" style={{ backgroundColor: 'var(--app-bg-main)', color: 'var(--app-text-primary)', maxHeight: '70vh' }}>
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                        Select the sections and tables to include in your professional LCCA report.
                    </p>
                    <div className="d-flex gap-2">
                        <Button variant="outline-secondary" size="sm" onClick={() => handleSelectAll(true)}>Select All</Button>
                        <Button variant="outline-secondary" size="sm" onClick={() => handleSelectAll(false)}>Deselect All</Button>
                    </div>
                </div>

                <div className="report-sections-tree">
                    {/* Top Level Sections */}
                    <div className="mb-3 p-3 rounded" style={{ backgroundColor: 'var(--app-bg-card)', border: '1px solid var(--app-border-light)' }}>
                        <h6 className="mb-3 fw-bold" style={{ color: 'var(--app-primary-accent)' }}>Main Sections</h6>
                        <Row>
                            <Col md={4}>
                                <Form.Check 
                                    type="checkbox"
                                    id="check-title-page"
                                    label="Title Page"
                                    checked={selections[SECTION_KEYS.KEY_SHOW_TITLE_PAGE]}
                                    onChange={() => handleToggle(SECTION_KEYS.KEY_SHOW_TITLE_PAGE)}
                                />
                            </Col>
                            <Col md={4}>
                                <Form.Check 
                                    type="checkbox"
                                    id="check-intro"
                                    label="Introduction"
                                    checked={selections[SECTION_KEYS.KEY_SHOW_INTRODUCTION]}
                                    onChange={() => handleToggle(SECTION_KEYS.KEY_SHOW_INTRODUCTION)}
                                />
                            </Col>
                            <Col md={4}>
                                <Form.Check 
                                    type="checkbox"
                                    id="check-results"
                                    label="LCCA Results"
                                    checked={selections[SECTION_KEYS.KEY_SHOW_LCCA_RESULTS]}
                                    onChange={() => handleToggle(SECTION_KEYS.KEY_SHOW_LCCA_RESULTS)}
                                />
                            </Col>
                        </Row>
                    </div>

                    {/* Input Data Detail */}
                    <h6 className="mb-3 fw-bold" style={{ color: 'var(--app-primary-accent)', paddingLeft: '5px' }}>Input Data Tables</h6>
                    <Accordion defaultActiveKey="0">
                        {Object.keys(SUBSECTION_MAP).map((group, idx) => (
                            <Accordion.Item eventKey={idx.toString()} key={group} style={{ backgroundColor: 'transparent', border: '1px solid var(--app-border-light)', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden' }}>
                                <Accordion.Header style={{ backgroundColor: 'var(--app-bg-card)' }}>
                                    <div className="d-flex align-items-center gap-3 w-100 pe-3">
                                        <span className="fw-bold">{group}</span>
                                        <div className="ms-auto">
                                            <Button 
                                                variant="link" 
                                                size="sm" 
                                                className="text-decoration-none p-0 me-2"
                                                onClick={(e) => { e.stopPropagation(); handleToggleGroup(group, true); }}
                                                style={{ fontSize: '0.75rem', color: 'var(--app-primary-accent)' }}
                                            >
                                                All
                                            </Button>
                                            <Button 
                                                variant="link" 
                                                size="sm" 
                                                className="text-decoration-none p-0"
                                                onClick={(e) => { e.stopPropagation(); handleToggleGroup(group, false); }}
                                                style={{ fontSize: '0.75rem', color: 'var(--app-text-muted)' }}
                                            >
                                                None
                                            </Button>
                                        </div>
                                    </div>
                                </Accordion.Header>
                                <Accordion.Body style={{ backgroundColor: 'var(--app-bg-card)' }}>
                                    <Row>
                                        {SUBSECTION_MAP[group].map((item) => (
                                            <Col md={6} key={item.key} className="mb-2">
                                                <Form.Check 
                                                    type="checkbox"
                                                    id={`check-${item.key}`}
                                                    label={item.label}
                                                    checked={selections[item.key]}
                                                    onChange={() => handleToggle(item.key)}
                                                    style={{ fontSize: '0.85rem' }}
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </div>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: '1px solid var(--app-border-light)', backgroundColor: 'var(--app-bg-card)' }}>
                <Button variant="outline-secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button 
                    variant="primary" 
                    className="fw-bold"
                    onClick={() => onConfirm(selections)}
                    style={{ backgroundColor: 'var(--app-primary-accent)', borderColor: 'var(--app-primary-accent)', color: '#000' }}
                >
                    Generate PDF Report
                </Button>
            </Modal.Footer>
            <style>{`
                .report-modal-content {
                    border: 1px solid var(--app-border-mid);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .accordion-button:not(.collapsed) {
                    background-color: var(--app-bg-main);
                    color: var(--app-primary-accent);
                    box-shadow: none;
                }
                .accordion-button::after {
                    filter: invert(var(--app-icon-invert));
                }
                .form-check-input:checked {
                    background-color: var(--app-primary-accent);
                    border-color: var(--app-primary-accent);
                }
            `}</style>
        </Modal>
    );
};

export default ReportSectionModal;
