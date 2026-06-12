const VEHICLE_KEYS = [
    'small_cars',
    'big_cars',
    'two_wheelers',
    'o_buses',
    'd_buses',
    'lcv',
    'hcv',
    'mcv',
];

const asObject = (value) => (
    value && typeof value === 'object' && !Array.isArray(value) ? value : {}
);

const asArray = (value) => (Array.isArray(value) ? value : []);

const clone = (value) => {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
};

const numberValue = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(String(value).replace(/,/g, '').replace('%', '').trim());
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizeObject = (value) => ({ ...asObject(value) });
const valueOrDefault = (value, fallback) => (
    value === '' || value === null || value === undefined ? fallback : value
);

export const normalizeGeneralInfo = (value, project = {}) => {
    const data = normalizeObject(value);
    return {
        ...data,
        project_name: data.project_name || project.name || '',
        project_country: data.project_country || project.country || '',
        project_currency: data.project_currency || project.currency || '',
        unit_system: data.unit_system || project.unitSystem || '',
    };
};

export const normalizeBridgeData = (value, project = {}) => {
    const data = normalizeObject(value);
    const generalInfo = asObject(project.general_info);
    const legacyLocation = [
        data.location_address,
        data.location_from,
        data.location_via,
        data.location_to,
    ].filter(Boolean).join(', ');

    return {
        ...data,
        bridge_name: data.bridge_name ?? '',
        user_agency: data.user_agency ?? '',
        project_country: data.project_country
            || data.location_country
            || generalInfo.project_country
            || project.country
            || 'INDIA',
        location: data.location || legacyLocation,
        bridge_type: data.bridge_type ?? '',
        span: valueOrDefault(data.span, 0),
        carriageway_width: valueOrDefault(data.carriageway_width, 0),
        num_lanes: valueOrDefault(data.num_lanes, 0),
        vehicle_path_direction: data.vehicle_path_direction ?? '',
        footpath: data.footpath ?? '',
        design_life: valueOrDefault(data.design_life, 0),
        analysis_period: valueOrDefault(
            data.analysis_period,
            valueOrDefault(data.service_life, 0),
        ),
        year_of_construction: valueOrDefault(
            data.year_of_construction,
            new Date().getFullYear(),
        ),
        duration_construction_months: valueOrDefault(data.duration_construction_months, 0),
        working_days_per_month: valueOrDefault(data.working_days_per_month, 22),
        days_per_month: valueOrDefault(data.days_per_month, 30),
    };
};

export const normalizeFinancialData = (value) => normalizeObject(value);

export const normalizeConstructionSections = (value, sectionKey = 'section') => (
    asArray(value).map((section, sectionIndex) => {
        const sectionData = asObject(section);
        return {
            ...sectionData,
            id: sectionData.id || `${sectionKey}-${sectionIndex + 1}`,
            name: sectionData.name || `Section ${sectionIndex + 1}`,
            rows: asArray(sectionData.rows).map((row, rowIndex) => {
                const rowData = asObject(row);
                return {
                    ...rowData,
                    id: rowData.id || `${sectionKey}-${sectionIndex + 1}-row-${rowIndex + 1}`,
                };
            }),
        };
    })
);

export const normalizeTrafficData = (value) => {
    const data = normalizeObject(value);
    const vehicles = asObject(data.vehicles || data.vehicle_data);
    const normalizedVehicles = VEHICLE_KEYS.reduce((acc, key) => {
        acc[key] = { ...asObject(vehicles[key]) };
        return acc;
    }, {});
    const alternateRoad = normalizeObject(data.alternate_road);
    const severity = normalizeObject(data.severity);
    const roadParams = normalizeObject(data.road_params);
    const profileYear = data.wpi_year
        || String(data.wpi_profile || '').match(/\d{4}/)?.[0]
        || '';

    return {
        ...data,
        calculation_mode: data.calculation_mode || data.mode || 'INDIA',
        vehicles: normalizedVehicles,
        alternate_road: alternateRoad,
        severity: severity,
        road_params: roadParams,
        peak_distribution: normalizeObject(data.peak_distribution || data.peak_hour_distribution),
        wpi_profile: data.wpi_profile || '',
        wpi_year: profileYear,
        wpi_data: normalizeObject(data.wpi_data || data.wpi?.data_snapshot || data.wpi?.WPI),
        wpi: data.wpi || (
            data.wpi_profile || data.wpi_data
                ? {
                    selected_profile_name: data.wpi_profile || '',
                    selected_profile_year: profileYear,
                    data_snapshot: normalizeObject(data.wpi_data),
                }
                : null
        ),
    };
};

export const normalizeCarbonEmissionData = (value) => {
    const data = normalizeObject(value);
    const transportData = normalizeObject(data.transport_emissions_data || data.transportation_emissions_data);
    const diversionData = normalizeObject(data.diversion_emissions_data || data.diversion_emissions);
    return {
        ...data,
        material_emissions_data: normalizeObject(data.material_emissions_data),
        transport_emissions_data: transportData,
        transportation_emissions_data: transportData,
        machinery_emissions_data: normalizeObject(data.machinery_emissions_data),
        diversion_emissions_data: diversionData,
        diversion_emissions: diversionData,
        social_cost_data: normalizeObject(data.social_cost_data),
    };
};

export const normalizeMaintenanceData = (value) => normalizeObject(value);

export const normalizeDemolitionData = (value) => {
    const data = normalizeObject(value);
    return {
        ...data,
        demolition_cost_pct: data.demolition_cost_pct ?? numberValue(data.demolition_cost) ?? 0,
        demolition_carbon_cost_pct: data.demolition_carbon_cost_pct ?? numberValue(data.demolition_carbon_cost) ?? 0,
    };
};

export const normalizeRecyclingData = (value) => {
    const data = normalizeObject(value);
    const included = asArray(data.included);
    const totalRecoveredValue = included.reduce((sum, item) => {
        return sum + (numberValue(asObject(item).recoveredValue) || 0);
    }, 0);
    return {
        ...data,
        included,
        excluded: asArray(data.excluded),
        total_recovered_value: totalRecoveredValue,
    };
};

export const normalizeOutputsData = (value) => normalizeObject(value);

const SECTION_NORMALIZERS = {
    general_info: normalizeGeneralInfo,
    bridge_data: normalizeBridgeData,
    financial_data: normalizeFinancialData,
    traffic_data: normalizeTrafficData,
    foundation_data: (value) => normalizeConstructionSections(value, 'foundation'),
    substructure_data: (value) => normalizeConstructionSections(value, 'substructure'),
    superstructure_data: (value) => normalizeConstructionSections(value, 'superstructure'),
    miscellaneous_data: (value) => normalizeConstructionSections(value, 'miscellaneous'),
    carbon_emission_data: normalizeCarbonEmissionData,
    maintenance_repair_data: normalizeMaintenanceData,
    demolition_data: normalizeDemolitionData,
    recycling_data: normalizeRecyclingData,
    outputs_data: normalizeOutputsData,
};

export const normalizeProjectSection = (sectionKey, value, project = {}) => {
    const normalizer = SECTION_NORMALIZERS[sectionKey];
    return normalizer ? normalizer(clone(value), project) : clone(value);
};

const required = (data, keys) => keys.filter((key) => (
    data[key] === '' || data[key] === null || data[key] === undefined
));

export const validateGeneralInfoData = (value) => {
    const missing = required(asObject(value), ['project_name']);
    return missing.map(() => 'Project Name is required.');
};

export const validateBridgeData = (value) => {
    const data = asObject(value);
    const errors = required(data, [
        'design_life',
        'analysis_period',
        'year_of_construction',
        'duration_construction_months',
    ]).map((key) => `${key.replaceAll('_', ' ')} is required.`);

    for (const key of ['design_life', 'analysis_period', 'duration_construction_months']) {
        const number = numberValue(data[key]);
        if (number !== null && number <= 0) errors.push(`${key.replaceAll('_', ' ')} must be greater than zero.`);
    }

    const daysPerMonth = numberValue(data.days_per_month);
    if (daysPerMonth !== null && (daysPerMonth < 29 || daysPerMonth > 31)) {
        errors.push('days per month must be between 29 and 31.');
    }
    return errors;
};

export const getBridgeWarnings = (value) => {
    const data = asObject(value);
    const warnings = [];
    const workingDays = numberValue(data.working_days_per_month);
    const daysPerMonth = numberValue(data.days_per_month);
    const yearOfConstruction = numberValue(data.year_of_construction);

    if (
        workingDays !== null
        && daysPerMonth !== null
        && workingDays > 0
        && daysPerMonth > 0
        && workingDays > daysPerMonth
    ) {
        warnings.push('working days per month cannot exceed days per month.');
    }
    if (yearOfConstruction !== null && yearOfConstruction < new Date().getFullYear()) {
        warnings.push('year of construction is in the past; confirm this is intentional.');
    }
    return warnings;
};

export const validateFinancialData = (value) => {
    const data = asObject(value);
    const errors = required(data, [
        'discount_rate',
        'inflation_rate',
        'interest_rate',
        'investment_ratio',
    ]).map((key) => `${key.replaceAll('_', ' ')} is required.`);

    for (const key of ['discount_rate', 'inflation_rate', 'interest_rate']) {
        const number = numberValue(data[key]);
        if (number !== null && number < 0) errors.push(`${key.replaceAll('_', ' ')} cannot be negative.`);
    }
    const investmentRatio = numberValue(data.investment_ratio);
    if (investmentRatio !== null && (investmentRatio < 0 || investmentRatio > 1)) {
        errors.push('investment ratio must be between 0 and 1.');
    }
    return errors;
};

export const validateTrafficData = (value) => {
    const data = normalizeTrafficData(value);
    const errors = [];
    if (!['INDIA', 'GLOBAL'].includes(data.calculation_mode)) {
        errors.push('Calculation mode must be INDIA or GLOBAL.');
        return errors;
    }
    if (data.calculation_mode === 'GLOBAL') {
        if (numberValue(data.road_user_cost_per_day) === null) {
            errors.push('Road user cost per day is required in GLOBAL mode.');
        }
        return errors;
    }

    const totalAdt = VEHICLE_KEYS.reduce((sum, key) => {
        return sum + (numberValue(data.vehicles[key]?.vehicles_per_day) || 0);
    }, 0);
    if (totalAdt > 0) {
        const accidentTotal = VEHICLE_KEYS.reduce((sum, key) => {
            return sum + (numberValue(data.vehicles[key]?.accident_percentage) || 0);
        }, 0);
        if (Math.abs(accidentTotal - 100) > 0.1) {
            errors.push('Vehicle accident percentages must sum to 100.');
        }
        if (!data.wpi_profile || Object.keys(data.wpi_data).length === 0) {
            errors.push('A WPI profile is required when INDIA mode traffic is greater than zero.');
        }
    }

    const severityTotal = ['severity_minor', 'severity_major', 'severity_fatal'].reduce((sum, key) => {
        return sum + (numberValue(data.severity[key]) || 0);
    }, 0);
    if (severityTotal > 0 && Math.abs(severityTotal - 100) > 0.001) {
        errors.push('Accident severity percentages must sum to 100.');
    }
    if (!data.alternate_road.alternate_road_carriageway) {
        errors.push('Alternate road carriageway is required in INDIA mode.');
    }
    if ((numberValue(data.alternate_road.carriage_width_in_m) || 0) <= 0) {
        errors.push('Alternate road carriage width must be greater than zero.');
    }
    if ((numberValue(data.alternate_road.hourly_capacity) || 0) <= 0) {
        errors.push('Alternate road hourly capacity must be greater than zero.');
    }
    return errors;
};

const validateLifecyclePercentages = (value, requiredKeys, positiveKeys) => {
    const data = asObject(value);
    const errors = required(data, requiredKeys).map((key) => `${key.replaceAll('_', ' ')} is required.`);
    for (const key of requiredKeys) {
        const number = numberValue(data[key]);
        if (number !== null && number < 0) errors.push(`${key.replaceAll('_', ' ')} cannot be negative.`);
    }
    for (const key of positiveKeys) {
        const number = numberValue(data[key]);
        if (number !== null && number <= 0) errors.push(`${key.replaceAll('_', ' ')} must be greater than zero.`);
    }
    return errors;
};

export const validateMaintenanceData = (value) => validateLifecyclePercentages(
    value,
    [
        'routine_inspection_cost',
        'routine_inspection_freq',
        'periodic_maintenance_cost',
        'periodic_maintenance_carbon_cost',
        'periodic_maintenance_freq',
        'major_inspection_cost',
        'major_inspection_freq',
        'major_repair_cost',
        'major_repair_carbon_cost',
        'major_repair_freq',
        'major_repair_duration',
        'bearing_exp_joint_cost',
        'bearing_exp_joint_freq',
        'bearing_exp_joint_duration',
    ],
    [
        'routine_inspection_freq',
        'periodic_maintenance_freq',
        'major_inspection_freq',
        'major_repair_freq',
        'major_repair_duration',
        'bearing_exp_joint_freq',
        'bearing_exp_joint_duration',
    ],
);

export const validateDemolitionData = (value) => validateLifecyclePercentages(
    value,
    ['demolition_cost', 'demolition_carbon_cost', 'demolition_duration'],
    ['demolition_duration'],
);
