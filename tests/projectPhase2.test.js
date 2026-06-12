import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeProjectData } from '../src/utils/projectSchema.js';
import {
    normalizeCarbonEmissionData,
    normalizeBridgeData,
    normalizeProjectSection,
    validateBridgeData,
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

test('bridge normalization mirrors desktop defaults and carries project country', () => {
    const normalized = normalizeBridgeData({
        location_country: '',
        location_from: 'Mumbai',
        location_via: 'Creek',
        location_to: 'Navi Mumbai',
        service_life: 75,
        year_of_construction: '',
        working_days_per_month: '',
        days_per_month: '',
    }, {
        country: 'INDIA',
        general_info: { project_country: 'INDIA' },
    });

    assert.equal(normalized.project_country, 'INDIA');
    assert.equal(normalized.location, 'Mumbai, Creek, Navi Mumbai');
    assert.equal(normalized.analysis_period, 75);
    assert.equal(normalized.year_of_construction, new Date().getFullYear());
    assert.equal(normalized.working_days_per_month, 22);
    assert.equal(normalized.days_per_month, 30);
});

test('bridge validation only requires the four desktop-required fields', () => {
    const errors = validateBridgeData({
        year_of_construction: 2026,
        design_life: 50,
        analysis_period: 75,
        duration_construction_months: 12,
        working_days_per_month: 22,
        days_per_month: 30,
    });

    assert.deepEqual(errors, []);

    const missing = validateBridgeData({
        bridge_name: '',
        user_agency: '',
        project_country: 'INDIA',
        year_of_construction: 2026,
        working_days_per_month: 22,
        days_per_month: 30,
    });
    assert.equal(missing.length, 3);
    assert.ok(missing.some((message) => message.includes('design life')));
    assert.ok(missing.some((message) => message.includes('analysis period')));
    assert.ok(missing.some((message) => message.includes('duration construction months')));
});
