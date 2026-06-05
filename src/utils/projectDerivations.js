import { normalizeProjectData } from './projectSchema';

const STRUCTURE_CHUNKS = [
    ['foundation_data', 'Foundation'],
    ['substructure_data', 'Sub Structure'],
    ['superstructure_data', 'Super Structure'],
    ['miscellaneous_data', 'Miscellaneous'],
];

const VEHICLE_TYPES = [
    'small_cars',
    'big_cars',
    'two_wheelers',
    'o_buses',
    'd_buses',
    'lcv',
    'hcv',
    'mcv',
];

export const parseNumber = (value, fallback = 0) => {
    if (value === null || value === undefined || value === '') return fallback;
    const parsed = Number(String(value).replace(/,/g, '').replace('%', '').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const getSectionsTotal = (sections) => {
    if (!Array.isArray(sections)) return 0;
    return sections.reduce((sum, section) => {
        const rows = Array.isArray(section?.rows) ? section.rows : [];
        return sum + rows.reduce((rowSum, row) => {
            return rowSum + parseNumber(row?.rate) * parseNumber(row?.qty);
        }, 0);
    }, 0);
};

export const getRecyclingTotal = (recyclingData) => {
    const included = Array.isArray(recyclingData?.included) ? recyclingData.included : [];
    return included.reduce((sum, item) => sum + parseNumber(item?.recoveredValue), 0);
};

export const getMaterialCarbonRows = (projectData) => {
    const project = normalizeProjectData(projectData);
    const carbonData = project.carbon_emission_data || {};
    const excludedIds = new Set(carbonData.material_emissions_data?.excluded_ids || []);

    return STRUCTURE_CHUNKS.flatMap(([chunkId, category]) => {
        const sections = Array.isArray(project[chunkId]) ? project[chunkId] : [];
        return sections.flatMap((section) => {
            const component = section?.name || '';
            const rows = Array.isArray(section?.rows) ? section.rows : [];
            return rows.map((row) => {
                const id = `${chunkId}-${row?.id}`;
                const quantity = parseNumber(row?.qty);
                const conversionFactor = parseNumber(row?.conversionFactor, 1) || 1;
                const emissionFactor = parseNumber(row?.carbonEmission?.factor);
                const totalKgCO2e = quantity * conversionFactor * emissionFactor;
                return {
                    id,
                    name: row?.workName || 'Unnamed Material',
                    category,
                    component,
                    quantity,
                    unit: row?.unit || '',
                    conversion_factor: conversionFactor,
                    emission_factor: emissionFactor,
                    total_kgCO2e: totalKgCO2e,
                    included: !excludedIds.has(id),
                };
            });
        });
    });
};

export const deriveConstructionWorkData = (projectData) => {
    const project = normalizeProjectData(projectData);
    const totals = {
        Foundation: { total: getSectionsTotal(project.foundation_data), rows: project.foundation_data },
        'Sub Structure': { total: getSectionsTotal(project.substructure_data), rows: project.substructure_data },
        'Super Structure': { total: getSectionsTotal(project.superstructure_data), rows: project.superstructure_data },
        Miscellaneous: { total: getSectionsTotal(project.miscellaneous_data), rows: project.miscellaneous_data },
    };
    const grandTotal = Object.values(totals).reduce((sum, section) => sum + section.total, 0);

    return {
        ...(project.construction_work_data || {}),
        ...totals,
        'Super-Structure': totals['Super Structure'],
        grand_total: grandTotal,
    };
};

export const deriveCarbonEmissionData = (projectData) => {
    const project = normalizeProjectData(projectData);
    const carbonData = project.carbon_emission_data || {};
    const materialRows = getMaterialCarbonRows(project);
    const includedMaterialRows = materialRows.filter((row) => row.included);
    const materialCategoryTotals = includedMaterialRows.reduce((acc, row) => {
        acc[row.category] = (acc[row.category] || 0) + row.total_kgCO2e;
        return acc;
    }, {});
    const materialTotal = includedMaterialRows.reduce((sum, row) => sum + row.total_kgCO2e, 0);

    const existingMaterial = carbonData.material_emissions_data || {};
    const diversion = carbonData.diversion_emissions_data || {};
    const webMode = diversion.mode || 'direct';
    const desktopMode = webMode === 'calculate' ? 'Calculate by Vehicle' : 'Enter Directly';
    const diversionTotal = parseNumber(
        diversion.total_calculated_emissions ??
        diversion.total_direct_emissions ??
        diversion.total_kgCO2e_per_day ??
        diversion.direct_value
    );
    const social = carbonData.social_cost_data || {};
    const socialCostLocal = parseNumber(
        social.result?.cost_of_carbon_local ??
        social.cost_of_carbon_local ??
        social.calculated_scc_local
    );

    return {
        ...carbonData,
        material_emissions_data: {
            ...existingMaterial,
            rows: materialRows,
            category_totals: materialCategoryTotals,
            total_kgCO2e: materialTotal,
        },
        diversion_emissions_data: {
            ...diversion,
            mode: webMode,
            calculation_mode: desktopMode,
            total_kgCO2e_per_day: diversionTotal,
            total_calculated_emissions: webMode === 'calculate' ? diversionTotal : parseNumber(diversion.total_calculated_emissions),
            total_direct_emissions: webMode === 'calculate' ? parseNumber(diversion.total_direct_emissions) : diversionTotal,
        },
        social_cost_data: {
            ...social,
            calculated_scc_local: socialCostLocal,
            cost_of_carbon_local: socialCostLocal,
            result: {
                ...(social.result || {}),
                cost_of_carbon_local: socialCostLocal,
            },
        },
    };
};

export const deriveDemolitionData = (projectData) => {
    const project = normalizeProjectData(projectData);
    const demolition = project.demolition_data || {};
    return {
        ...demolition,
        demolition_cost_pct: parseNumber(demolition.demolition_cost_pct ?? demolition.demolition_cost),
        demolition_carbon_cost_pct: parseNumber(demolition.demolition_carbon_cost_pct ?? demolition.demolition_carbon_cost),
    };
};

export const deriveRecyclingData = (projectData) => {
    const project = normalizeProjectData(projectData);
    return {
        ...(project.recycling_data || {}),
        total_recovered_value: getRecyclingTotal(project.recycling_data),
    };
};

export const deriveTrafficAndRoadData = (projectData) => {
    const project = normalizeProjectData(projectData);
    const traffic = project.traffic_data || {};
    const vehicleData = traffic.vehicle_data || traffic.vehicles || {};
    const vehiclesPerDay = traffic.vehicles_per_day || {};
    const roadParams = traffic.road_params || {};
    const alternateRoad = traffic.alternate_road || {};

    const normalizedVehicles = VEHICLE_TYPES.reduce((acc, key) => {
        const row = vehicleData[key] || {};
        acc[key] = {
            adt: parseNumber(row.adt ?? row.ADT ?? vehiclesPerDay[key]),
            traffic_growth: parseNumber(row.traffic_growth ?? row.growth_rate ?? traffic.traffic_growth),
            velocity: parseNumber(row.velocity ?? row.speed),
            VOC: parseNumber(row.VOC ?? row.voc),
            occupancy: parseNumber(row.occupancy),
            emission_factor: parseNumber(row.emission_factor ?? row.ef),
        };
        return acc;
    }, {});

    const wpiSnapshot = traffic.wpi || (
        traffic.wpi_profile || traffic.wpi_data
            ? {
                selected_profile_name: traffic.wpi_profile || '',
                selected_profile_year: traffic.wpi_year || '',
                data_snapshot: traffic.wpi_data || {},
            }
            : null
    );

    return {
        ...traffic,
        mode: traffic.mode || traffic.calculation_mode || 'GLOBAL',
        vehicle_data: normalizedVehicles,
        severity_minor: parseNumber(traffic.severity_minor ?? traffic.severity?.minor),
        severity_major: parseNumber(traffic.severity_major ?? traffic.severity?.major),
        severity_fatal: parseNumber(traffic.severity_fatal ?? traffic.severity?.fatal),
        carriage_width_in_m: parseNumber(traffic.carriage_width_in_m ?? roadParams.carriage_width_in_m),
        hourly_capacity: parseNumber(traffic.hourly_capacity ?? roadParams.hourly_capacity),
        alternate_road_carriageway: parseNumber(traffic.alternate_road_carriageway ?? alternateRoad.alternate_road_carriageway),
        alternate_road_speed: parseNumber(traffic.alternate_road_speed ?? alternateRoad.alternate_road_speed),
        road_user_cost_per_day: parseNumber(traffic.road_user_cost_per_day),
        peak_hour_distribution: traffic.peak_hour_distribution || traffic.peak_distribution || {},
        wpi: wpiSnapshot,
    };
};

export const buildCalculationProjectInputs = (projectData) => {
    const project = normalizeProjectData(projectData);
    return {
        ...project,
        bridge_data: project.bridge_data || {},
        financial_data: project.financial_data || {},
        traffic_data: project.traffic_data || {},
        traffic_and_road_data: deriveTrafficAndRoadData(project),
        construction_work_data: deriveConstructionWorkData(project),
        carbon_emission_data: deriveCarbonEmissionData(project),
        maintenance_data: project.maintenance_repair_data || {},
        maintenance_repair_data: project.maintenance_repair_data || {},
        demolition_data: deriveDemolitionData(project),
        recycling_data: deriveRecyclingData(project),
    };
};
