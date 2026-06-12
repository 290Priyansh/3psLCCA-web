import { getConstructionTrash } from '../../../utils/constructionExcel';

const totalFor = (row) => ((Number(row.rate) || 0) * (Number(row.qty) || 0)).toFixed(2);

export default function ConstructionTrash({ projectData, onRestore, onDelete, onDeleteAll }) {
    const rows = getConstructionTrash(projectData);

    return (
        <div>
            <div className="d-flex align-items-start justify-content-between mb-3">
                <div>
                    <h5 className="mb-1">Trash Bin</h5>
                    <div style={{ color: 'var(--app-text-secondary)', fontSize: '0.82rem' }}>
                        Items here are excluded from all calculations and Excel exports.
                    </div>
                </div>
                <button type="button" className="btn btn-sm btn-danger" disabled={!rows.length} onClick={onDeleteAll}>
                    Delete All
                </button>
            </div>

            {!rows.length ? (
                <div className="text-center fst-italic py-5" style={{ color: 'var(--app-text-muted)' }}>No items in Trash Bin.</div>
            ) : (
                <div className="table-responsive border rounded">
                    <table className="table table-sm align-middle m-0">
                        <thead>
                            <tr>
                                <th>Deleted From</th>
                                <th>Material</th>
                                <th>Quantity</th>
                                <th>Rate</th>
                                <th>Total</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={`${row.sectionKey}-${row.sectionId}-${row.id}`}>
                                    <td>{row.category} / {row.component}</td>
                                    <td>{row.workName || 'Unnamed Material'}</td>
                                    <td>{row.qty} {row.unit}</td>
                                    <td>{row.rate}</td>
                                    <td>{totalFor(row)}</td>
                                    <td className="text-end">
                                        <button type="button" className="btn btn-sm btn-outline-secondary me-2" onClick={() => onRestore(row)}>Restore</button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(row)}>Permanently Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
