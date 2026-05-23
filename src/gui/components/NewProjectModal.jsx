import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const NewProjectModal = ({ show, onHide, onCreate }) => {
    const [projectName, setProjectName] = useState('');
    const [country, setCountry] = useState('');
    const [currency, setCurrency] = useState('');
    const [unitSystem, setUnitSystem] = useState('Metric (SI)');

    // Reset fields when modal opens
    useEffect(() => {
        if (show) {
            setProjectName('');
            setCountry('');
            setCurrency('');
            setUnitSystem('Metric (SI)');
        }
    }, [show]);

    const handleCountryChange = (e) => {
        const val = e.target.value;
        setCountry(val);
        // Auto-fill currency based on country (Simple mapping for demo)
        if (val === 'India') setCurrency('Indian Rupee (INR)');
        else if (val === 'USA') setCurrency('US Dollar (USD)');
        else if (val === 'UK') setCurrency('British Pound (GBP)');
        else setCurrency('');
    };

    const handleCreate = () => {
        if (!projectName || !country || !currency) {
            alert('Please fill in all required fields.');
            return;
        }
        onCreate({
            name: projectName,
            country,
            currency,
            unitSystem,
            createdAt: new Date().toLocaleString()
        });
        onHide();
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            centered 
            contentClassName="new-project-modal"
            style={{ fontFamily: '"Segoe UI", sans-serif' }}
        >
            <style>{`
                .new-project-modal {
                    background-color: var(--app-bg-card);
                    border: 1px solid var(--app-border-mid);
                    color: var(--app-text-primary);
                    border-radius: 12px;
                    max-width: 480px;
                    margin: auto;
                }
                .new-project-modal .modal-header {
                    border-bottom: 1px solid var(--app-border-light);
                    padding: 0.75rem 1.25rem;
                }
                .new-project-modal .modal-body {
                    padding: 1.25rem;
                }
                .new-project-modal .modal-footer {
                    border-top: none;
                    padding: 0 1.25rem 1.25rem 1.25rem;
                }
                .new-project-modal .form-label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }
                .new-project-modal .form-control, .new-project-modal .form-select {
                    background-color: var(--app-bg-alt);
                    border: 1px solid var(--app-border-mid);
                    color: var(--app-text-primary);
                    font-size: 0.9rem;
                    padding: 0.6rem;
                }
                .new-project-modal .form-control:focus, .new-project-modal .form-select:focus {
                    background-color: var(--app-bg-alt);
                    border-color: var(--app-primary-accent);
                    box-shadow: 0 0 0 0.2rem rgba(154, 205, 50, 0.1);
                    color: var(--app-text-primary);
                }
                .new-project-modal .help-text {
                    font-size: 0.75rem;
                    color: var(--app-text-secondary);
                    margin-top: 0.4rem;
                }
                .btn-create {
                    background-color: var(--app-primary-accent);
                    border: none;
                    color: #000;
                    font-weight: 600;
                    padding: 0.5rem 1.5rem;
                    border-radius: 8px;
                }
                .btn-create:hover {
                    background-color: var(--app-primary-accent);
                    opacity: 0.9;
                    color: #000;
                }
                .btn-cancel {
                    background-color: transparent;
                    border: 1px solid var(--app-border-mid);
                    color: var(--app-text-secondary);
                    font-weight: 600;
                    padding: 0.5rem 1.5rem;
                    border-radius: 8px;
                }
                .btn-cancel:hover {
                    background-color: var(--app-bg-alt);
                    color: var(--app-text-primary);
                }
            `}</style>
            <Modal.Header closeButton closeVariant="white">
                <Modal.Title className="fw-semibold" style={{ fontSize: '1.1rem' }}>
                    <span className="me-2">📁</span> New Project
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Project Name</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="e.g. Highway 5 Bridge Replacement" 
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                        />
                        <div className="help-text">You can rename this later.</div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Country</Form.Label>
                        <Form.Select value={country} onChange={handleCountryChange}>
                            <option value="">- Select country -</option>
                            <option value="India">India</option>
                            <option value="USA">USA</option>
                            <option value="UK">UK</option>
                        </Form.Select>
                        <div className="help-text">Cannot be changed after project creation.</div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Currency</Form.Label>
                        <Form.Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                            <option value="">- Select currency -</option>
                            <option value="Indian Rupee (INR)">Indian Rupee (INR)</option>
                            <option value="US Dollar (USD)">US Dollar (USD)</option>
                            <option value="British Pound (GBP)">British Pound (GBP)</option>
                        </Form.Select>
                        <div className="help-text">Auto-filled based on country.</div>
                    </Form.Group>

                    <Form.Group className="mb-0">
                        <Form.Label>Unit System</Form.Label>
                        <Form.Select value={unitSystem} onChange={(e) => setUnitSystem(e.target.value)}>
                            <option value="Metric (SI)">Metric (SI)</option>
                            <option value="Imperial">Imperial</option>
                        </Form.Select>
                        <div className="help-text">Cannot be changed after project creation.</div>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer className="gap-2">
                <Button className="btn-create" onClick={handleCreate}>
                    Create
                </Button>
                <Button className="btn-cancel" onClick={onHide}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default NewProjectModal;
