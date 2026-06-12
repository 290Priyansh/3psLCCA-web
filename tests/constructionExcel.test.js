import test from 'node:test';
import assert from 'node:assert/strict';
import {
    applyConstructionImport,
    buildConstructionWorkbook,
    getActiveConstructionCount,
    getConstructionTrash,
    parseConstructionWorkbook,
} from '../src/utils/constructionExcel.js';
import { deriveConstructionWorkData } from '../src/utils/projectDerivations.js';

const project = {
    name: 'Workbook Test',
    country: 'INDIA',
    currency: 'INR',
    general_info: {
        project_name: 'Workbook Test',
        project_code: 'WB-01',
        project_country: 'INDIA',
        project_currency: 'INR',
    },
    foundation_data: [{
        id: 'pile-cap',
        name: 'Pile Cap',
        rows: [{
            id: 'steel',
            srcId: '12.42',
            workName: 'Steel Rebar',
            qty: 10,
            unit: 't',
            rate: 74401.1,
            source: 'Bihar SOR',
            carbonEmission: { factor: 2.6, perUnit: 'kgCO2e/kg', source: 'IFC' },
            conversionFactor: 1000,
            scrapRate: 5,
            recoveryPct: 80,
            state: { in_trash: false },
        }],
    }],
    substructure_data: [],
    superstructure_data: [],
    miscellaneous_data: [],
};

test('construction workbook round-trips the desktop CAT# schema through preview', async () => {
    const workbook = await buildConstructionWorkbook(project, new Date('2026-06-12T00:00:00Z'));
    const buffer = await workbook.xlsx.writeBuffer();
    const preview = await parseConstructionWorkbook(buffer, {});

    assert.deepEqual(preview.sheets.map((sheet) => sheet.name), [
        'CAT#Foundation',
        'CAT#Sub-Structure',
        'CAT#Super-Structure',
        'CAT#Misc',
    ]);
    assert.equal(preview.metadata.find((item) => item.key === 'Project Name').value, 'Workbook Test');
    assert.equal(preview.sheets[0].rows[0].component, 'Pile Cap');
    assert.equal(preview.sheets[0].rows[0].workName, 'Steel Rebar');
    assert.equal(preview.sheets[0].rows[0].selected, true);

    const imported = applyConstructionImport({
        foundation_data: [],
        substructure_data: [],
        superstructure_data: [],
        miscellaneous_data: [],
    }, preview);
    assert.equal(imported.foundation_data[0].rows[0].rate, 74401.1);
    assert.equal(imported.foundation_data[0].rows[0].carbonEmission.factor, 2.6);
});

test('trashed construction rows are isolated from counts and derived totals', () => {
    const withTrash = structuredClone(project);
    withTrash.foundation_data[0].rows.push({
        id: 'trashed',
        workName: 'Deleted concrete',
        qty: 100,
        rate: 500,
        state: { in_trash: true },
    });

    assert.equal(getConstructionTrash(withTrash).length, 1);
    assert.equal(getActiveConstructionCount(withTrash), 1);
    assert.equal(deriveConstructionWorkData(withTrash).grand_total, 744011);
});
