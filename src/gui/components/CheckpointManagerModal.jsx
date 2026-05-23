import React, { useState } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import { FaClock, FaTrashAlt, FaUndo, FaPlus } from 'react-icons/fa';

const CheckpointManagerModal = ({ show, onHide, checkpoints, onDelete, onRestore, onAddNew }) => {
    const [selectedIndex, setSelectedIndex] = useState(null);

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleDelete = () => {
        if (selectedIndex !== null) {
            onDelete(selectedIndex);
            setSelectedIndex(null);
        }
    };

    const handleRestore = () => {
        if (selectedIndex !== null) {
            onRestore(checkpoints[selectedIndex]);
            onHide();
        }
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            centered 
            size="lg"
            className="checkpoint-manager-modal"
            contentClassName="border-0"
        >
            <style>{`
                .checkpoint-manager-modal .modal-content {
                    background-color: var(--app-bg-card) !important;
                    border-radius: 8px;
                    border: 1px solid var(--app-border-mid) !important;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    color: var(--app-text-primary);
                }
                .checkpoint-table-container {
                    background-color: var(--app-bg-main);
                    border: 1px solid var(--app-border-mid);
                    border-radius: 4px;
                    max-height: 350px;
                    overflow-y: auto;
                    margin-bottom: 20px;
                }
                .checkpoint-table {
                    margin-bottom: 0;
                    color: var(--app-text-secondary);
                    font-size: 14px;
                }
                .checkpoint-table th {
                    background-color: var(--app-bg-alt);
                    color: var(--app-text-secondary);
                    font-weight: 500;
                    border-bottom: 1px solid var(--app-border-mid) !important;
                    padding: 12px 15px;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }
                .checkpoint-table td {
                    padding: 10px 15px;
                    border-bottom: 1px solid var(--app-border-mid) !important;
                    vertical-align: middle;
                    cursor: pointer;
                }
                .checkpoint-table tr:hover td {
                    background-color: var(--app-surface-pressed);
                }
                .checkpoint-table tr.selected td {
                    background-color: var(--app-primary-accent);
                    color: var(--app-bg-card);
                }
                .btn-green-plus {
                    background-color: var(--app-primary-accent) !important;
                    border: none !important;
                    color: var(--app-bg-card) !important;
                    font-weight: 600;
                    padding: 10px 20px;
                    border-radius: 6px;
                }
                .btn-green-plus:hover {
                    background-color: color-mix(in srgb, var(--app-primary-accent) 80%, #fff) !important;
                }
                .btn-outline-danger-custom {
                    border: 1px solid var(--app-danger) !important;
                    color: var(--app-danger) !important;
                    background: transparent !important;
                    padding: 8px 16px;
                }
                .btn-outline-danger-custom:hover:not(:disabled) {
                    background-color: color-mix(in srgb, var(--app-danger) 10%, transparent) !important;
                }
                .btn-outline-secondary-custom {
                    border: 1px solid var(--app-border-mid) !important;
                    color: var(--app-text-secondary) !important;
                    background: transparent !important;
                    padding: 8px 16px;
                }
                .btn-outline-secondary-custom:hover:not(:disabled) {
                    background-color: var(--app-surface-pressed) !important;
                    color: var(--app-text-primary) !important;
                }
                .restore-hint {
                    color: var(--app-text-secondary);
                    font-size: 14px;
                    margin-bottom: 20px;
                }
                /* Scrollbar styling */
                .checkpoint-table-container::-webkit-scrollbar {
                    width: 8px;
                }
                .checkpoint-table-container::-webkit-scrollbar-track {
                    background: var(--app-bg-main);
                }
                .checkpoint-table-container::-webkit-scrollbar-thumb {
                    background: var(--app-border-mid);
                    border-radius: 4px;
                }
                .checkpoint-table-container::-webkit-scrollbar-thumb:hover {
                    background: var(--app-text-secondary);
                }
            `}</style>

            <Modal.Header closeButton closeVariant="white" className="border-0 pb-0">
                <Modal.Title className="d-flex align-items-center gap-2" style={{ fontSize: '18px' }}>
                    <FaClock style={{ color: '#aaa' }} /> Checkpoint Manager
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="pt-3">
                <p className="restore-hint">
                    Select a checkpoint to restore or delete it. Restoring will replace all current project data with the snapshot.
                </p>

                <div className="checkpoint-table-container">
                    <Table responsive className="checkpoint-table">
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>Label</th>
                                <th style={{ width: '25%' }}>Date & Time</th>
                                <th style={{ width: '20%' }}>Notes</th>
                                <th style={{ width: '35%' }}>File</th>
                            </tr>
                        </thead>
                        <tbody>
                            {checkpoints.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-5" style={{ color: '#555' }}>
                                        No checkpoints saved yet.
                                    </td>
                                </tr>
                            ) : (
                                checkpoints.map((cp, idx) => (
                                    <tr 
                                        key={idx} 
                                        className={selectedIndex === idx ? 'selected' : ''}
                                        onClick={() => setSelectedIndex(idx)}
                                    >
                                        <td className="fw-bold">{cp.label}</td>
                                        <td>{formatDate(cp.timestamp)}</td>
                                        <td className="text-truncate" style={{ maxWidth: '100px' }}>
                                            {cp.notes || '-'}
                                        </td>
                                        <td style={{ fontSize: '12px', color: '#777' }}>
                                            {`cp_${cp.label.toLowerCase().replace(/\s+/g, '_')}_${cp.timestamp.replace(/[-:T.]/g, '')}.3psLCCA`}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            </Modal.Body>

            <Modal.Footer className="border-0 pb-4 d-flex justify-content-between">
                <Button className="btn-green-plus d-flex align-items-center gap-2" onClick={onAddNew}>
                    <FaPlus /> New Checkpoint
                </Button>
                
                <div className="d-flex gap-2">
                    <Button 
                        variant="outline-danger" 
                        className="btn-outline-danger-custom d-flex align-items-center gap-2"
                        disabled={selectedIndex === null}
                        onClick={handleDelete}
                    >
                        <FaTrashAlt /> Delete
                    </Button>
                    <Button 
                        variant="outline-secondary" 
                        className="btn-outline-secondary-custom d-flex align-items-center gap-2"
                        disabled={selectedIndex === null}
                        onClick={handleRestore}
                    >
                        <FaUndo /> Restore
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default CheckpointManagerModal;
