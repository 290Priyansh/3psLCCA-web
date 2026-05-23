import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const EditRecyclabilityModal = ({ show, onClose, item, onSave }) => {
    if (!show) return null;

    const [formData, setFormData] = useState({
        materialName: item?.material || 'Steel Rebar (Fe500)',
        itemId: '',
        quantityValue: item?.qtyValue || '2.102',
        quantityUnit: item?.qtyUnit || 'm - Metre',
        rateCost: '88341.0',
        rateSource: '',
        emissionFactor: '2.6',
        perUnit: 'kg - Kilogram',
        emissionSource: '',
        conversionFactor: '1000.0',
        scrapRate: item?.scrapRate || '32500.000',
        recoveryPercent: item?.recyclability || '75.000',
        grade: '',
        type: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave({ ...item, ...formData });
        onClose();
    };

    return (
        <Modal 
            show={show} 
            onHide={onClose} 
            centered 
            size="lg"
            className="custom-edit-modal"
            contentClassName="bg-dark text-light border-0"
            style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
        >
            <style>{`
                .custom-edit-modal .modal-content {
                    background-color: var(--app-bg-card) !important;
                    color: var(--app-text-primary) !important;
                    border-radius: 8px;
                    border: 1px solid var(--app-border-mid) !important;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                }
                .custom-edit-modal .modal-header {
                    border-bottom: 1px solid var(--app-border-light);
                    padding: 12px 20px;
                }
                .custom-edit-modal .modal-footer {
                    border-top: 1px solid var(--app-border-light);
                    padding: 12px 20px;
                }
                .custom-edit-modal .form-control, .custom-edit-modal .form-select {
                    background-color: var(--app-input-bg) !important;
                    border: 1px solid var(--app-input-border) !important;
                    color: var(--app-input-text) !important;
                    font-size: 0.85rem;
                }
                .custom-edit-modal .form-control:focus, .custom-edit-modal .form-select:focus {
                    border-color: var(--app-primary-accent) !important;
                    box-shadow: 0 0 0 2px rgba(154, 205, 50, 0.25) !important;
                }
                .custom-edit-modal .form-label {
                    color: var(--app-text-secondary);
                    font-size: 0.85rem;
                    margin-bottom: 4px;
                }
                .custom-edit-modal .section-box {
                    background-color: var(--app-bg-main);
                    border: 1px solid var(--app-border-light);
                    border-radius: 6px;
                    padding: 16px;
                    margin-bottom: 16px;
                }
                .btn-green-save {
                    background-color: var(--app-primary-accent) !important;
                    border-color: var(--app-primary-accent) !important;
                    color: #000 !important;
                    font-weight: 600;
                    padding: 6px 16px;
                    font-size: 0.85rem;
                }
                .btn-cancel-dark {
                    background-color: var(--app-bg-alt) !important;
                    border: 1px solid var(--app-border-mid) !important;
                    color: var(--app-text-secondary) !important;
                    padding: 6px 16px;
                    font-size: 0.85rem;
                }
                .btn-cancel-dark:hover {
                    color: var(--app-text-primary) !important;
                    background-color: var(--app-border-light) !important;
                }
                /* Need to override close button to make it visible on dark background if necessary, 
                   but 'btn-close-white' is standard bootstrap */
            `}</style>

            <Modal.Header closeButton closeVariant={document.documentElement.style.getPropertyValue('--app-bg-main') === '#f5f6f8' ? undefined : "white"}>
                <Modal.Title className="fw-bold" style={{ fontSize: '1rem' }}>
                    Edit Recyclability - {formData.materialName}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="p-4">
                <Row className="mb-3">
                    <Col>
                        <Form.Label>Material Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="materialName" value={formData.materialName} onChange={handleChange} />
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col>
                        <Form.Label>Item ID / SOR Code</Form.Label>
                        <Form.Control type="text" placeholder="e.g. 12.01 (Leave blank for manual)" name="itemId" value={formData.itemId} onChange={handleChange} />
                    </Col>
                </Row>

                <Form.Group className="mb-3" controlId="allowDbEditing">
                    <Form.Check type="checkbox" label={<span style={{ color: 'var(--app-text-secondary)', fontSize: '0.85rem' }}>Allow editing DB-filled values</span>} />
                </Form.Group>

                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="quantityValue" value={formData.quantityValue} onChange={handleChange} />
                    </Col>
                    <Col md={6}>
                        <Form.Label>Unit <span className="text-danger">*</span></Form.Label>
                        <Form.Select name="quantityUnit" value={formData.quantityUnit} onChange={handleChange}>
                            <option>m - Metre</option>
                            <option>t - Tonnes</option>
                            <option>m³ - Cubic Metre</option>
                        </Form.Select>
                    </Col>
                </Row>

                <Row className="mb-4">
                    <Col md={6}>
                        <Form.Label>Rate (Cost)</Form.Label>
                        <Form.Control type="text" name="rateCost" value={formData.rateCost} onChange={handleChange} />
                    </Col>
                    <Col md={6}>
                        <Form.Label>Rate Source</Form.Label>
                        <Form.Control type="text" placeholder="e.g. DSR 2023, Market Rate" name="rateSource" value={formData.rateSource} onChange={handleChange} />
                    </Col>
                </Row>

                {/* Carbon Emission Section */}
                <div className="section-box">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="m-0" style={{ fontSize: '0.9rem', color: 'var(--app-logo-accent)', fontWeight: 'bold' }}>Carbon Emission</h6>
                        <Form.Check type="checkbox" id="includeCarbon" label="Include" defaultChecked style={{ fontSize: '0.85rem', color: 'var(--app-text-primary)' }} />
                    </div>
                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Label>Emission Factor</Form.Label>
                            <Form.Control type="text" name="emissionFactor" value={formData.emissionFactor} onChange={handleChange} />
                        </Col>
                        <Col md={4}>
                            <Form.Label>Per Unit (kgCO2e / ...)</Form.Label>
                            <Form.Select name="perUnit" value={formData.perUnit} onChange={handleChange}>
                                <option>kg - Kilogram</option>
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Label>Emission Factor Source</Form.Label>
                            <Form.Control type="text" placeholder="e.g. ICE v3.0, IPCC" name="emissionSource" value={formData.emissionSource} onChange={handleChange} />
                        </Col>
                    </Row>
                    <div className="mb-2">
                        <Form.Label>Conversion Factor</Form.Label>
                        <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '0.85rem' }}>1 {formData.quantityUnit.split(' ')[0]} =</span>
                            <Form.Control type="text" style={{ width: '90px' }} name="conversionFactor" value={formData.conversionFactor} onChange={handleChange} />
                            <span style={{ fontSize: '0.85rem' }}>kg</span>
                            <span style={{ color: 'var(--app-text-muted)', fontSize: '0.75rem', marginLeft: '8px' }}>e.g. density for Length → Mass</span>
                        </div>
                    </div>
                    <div className="mt-3" style={{ fontSize: '0.85rem', color: 'var(--app-primary-accent)' }}>
                        {formData.quantityValue} {formData.quantityUnit.split(' ')[0]} × 1000 × {formData.emissionFactor} kgCO2e/kg = <span className="fw-bold" style={{ color: 'var(--app-text-primary)' }}>5,465.200 kgCO2e</span>
                    </div>
                </div>

                {/* Recyclability Section */}
                <div className="section-box mb-0">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="m-0" style={{ fontSize: '0.9rem', color: 'var(--app-logo-accent)', fontWeight: 'bold' }}>Recyclability</h6>
                        <Form.Check type="checkbox" id="includeRecyclability" label="Include" defaultChecked style={{ fontSize: '0.85rem', color: 'var(--app-text-primary)' }} />
                    </div>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Label>Scrap Rate (per unit)</Form.Label>
                            <Form.Control type="text" name="scrapRate" value={formData.scrapRate} onChange={handleChange} />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Recovery after Demolition (%)</Form.Label>
                            <Form.Control type="text" name="recoveryPercent" value={formData.recoveryPercent} onChange={handleChange} />
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Label>Grade</Form.Label>
                            <Form.Control type="text" placeholder="e.g. M25, Fe500" name="grade" value={formData.grade} onChange={handleChange} />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Type</Form.Label>
                            <Form.Select name="type" value={formData.type} onChange={handleChange}>
                                <option value="">e.g. Concrete, Steel</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </div>
            </Modal.Body>

            <Modal.Footer className="d-flex justify-content-between">
                <Button 
                    style={{ backgroundColor: 'var(--app-border-dark)', border: '1px solid var(--app-border-mid)', color: 'var(--app-text-inverse)', fontSize: '0.85rem', padding: '6px 16px' }}
                >
                    Save to Custom DB...
                </Button>
                <div className="d-flex gap-2">
                    <Button className="btn-cancel-dark" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button className="btn-green-save" onClick={handleSave}>
                        Save Recyclability Data
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default EditRecyclabilityModal;
