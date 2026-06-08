import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeProjectData } from '../src/utils/projectSchema.js';
import {
    normalizeCarbonEmissionData,
    normalizeProjectSection,
    validateDemolitionData,
    validateFinancialData,
    validateMaintenanceData,
    validateTrafficData,
} from '../src/utils/projectPageSchema.js';
import { buildCalculationProjectInputs } from '../src/utils/projectDerivations.js';

test('legacy project data normalizes without losing old maintenance or construction fields', () => {
    const normalized = normalizeProjectData({
        name: 'Legacy Bridge',
        construction_work_data: {
            Foundation: { rows: [{ workName: 'Pile', rate: '10', qty: '2' }] },
        },
        maintenance_data: {
            routine_inspection_cost: '0',
        },
    });

    assert.equal(normalized.schema_version, 1);
    assert.equal(normalized.general_info.project_name, 'Legacy Bridge');
    assert.equal(normalized.foundation_data[0].rows[0].workName, 'Pile');
    assert.equal(normalized.maintenance_repair_data.routine_inspection_cost, '0');
    assert.equal(normalized.maintenance_data.routine_inspection_cost, '0');
});

test('carbon emission data preserves transport and diversion aliases', () => {
    const normalized = normalizeCarbonEmissionData({
        transportation_emissions_data: { total_kgCO2e: 12 },
        diversion_emissions: { total_direct_emissions: 5 },
    });

    assert.equal(normalized.transport_emissions_data.total_kgCO2e, 12);
    assert.equal(normalized.transportation_emissions_data.total_kgCO2e, 12);
    assert.equal(normalized.diversion_emissions_data.total_direct_emissions, 5);
    assert.equal(normalized.diversion_emissions.total_direct_emissions, 5);
});

test('traffic page state derives to core-compatible traffic fields', () => {
    const project = normalizeProjectData({
        traffic_data: normalizeProjectSection('traffic_data', {
            calculation_mode: 'INDIA',
            vehicles: {
                small_cars: { vehicles_per_day: 10, accident_percentage: 100 },
            },
            severity: {
                severity_minor: 60,
                severity_major: 30,
                severity_fatal: 10,
            },
            alternate_road: {
                alternate_road_carriageway: 'Two Lane',
                carriage_width_in_m: 7,
                hourly_capacity: 1500,
            },
            road_params: {
                road_roughness_mm_per_km: 2000,
                work_zone_multiplier: 0.5,
            },
            peak_distribution: { h1: 0.1, h2: 0.1 },
            wpi_profile: '2024',
            wpi_data: { small_cars: { petrol: 1 } },
        }),
    });

    const derived = buildCalculationProjectInputs(project).traffic_and_road_data;
    assert.equal(derived.mode, 'INDIA');
    assert.equal(derived.vehicle_data.small_cars.vehicles_per_day, 10);
    assert.equal(derived.vehicle_data.small_cars.accident_percentage, 100);
    assert.equal(derived.severity_minor, 60);
    assert.equal(derived.alternate_road_carriageway, 'Two Lane');
});

test('page validators allow zero-cost percentages but reject invalid durations and traffic sums', () => {
    assert.deepEqual(validateFinancialData({
        discount_rate: '0',
        inflation_rate: '0',
        interest_rate: '0',
        investment_ratio: '0',
    }), []);

    assert.deepEqual(validateMaintenanceData({
        routine_inspection_cost: '0',
        routine_inspection_freq: '1',
        periodic_maintenance_cost: '0',
        periodic_maintenance_carbon_cost: '0',
        periodic_maintenance_freq: '5',
        major_inspection_cost: '0',
        major_inspection_freq: '5',
        major_repair_cost: '0',
        major_repair_carbon_cost: '0',
        major_repair_freq: '20',
        major_repair_duration: '3',
        bearing_exp_joint_cost: '0',
        bearing_exp_joint_freq: '25',
        bearing_exp_joint_duration: '2',
    }), []);

    assert.ok(validateDemolitionData({
        demolition_cost: '0',
        demolition_carbon_cost: '0',
        demolition_duration: '0',
    }).some((message) => message.includes('duration')));

    assert.ok(validateTrafficData({
        calculation_mode: 'INDIA',
        vehicles: { small_cars: { vehicles_per_day: 10, accident_percentage: 50 } },
        severity: { severity_minor: 60, severity_major: 30, severity_fatal: 10 },
        alternate_road: { alternate_road_carriageway: 'Two Lane', carriage_width_in_m: 7, hourly_capacity: 1500 },
        wpi_profile: '2024',
        wpi_data: { small_cars: { petrol: 1 } },
    }).some((message) => message.includes('Vehicle accident percentages')));
});
