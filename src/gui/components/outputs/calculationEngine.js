/**
 * LCCA Calculation Engine
 * 
 * Ported from the core LCCA formulas.
 * Takes all project inputs and generates the lifecycle results object.
 */

export const runLccaCalculation = (projectInputs) => {
    const {
        bridge_data = {},
        financial_data = {},
        traffic_data = {},
        construction_work_data = {},
        carbon_emission_data = {},
        maintenance_data = {},
        demolition_data = {},
        recycling_data = {}
    } = projectInputs;

    // --- 1. Basic Parameters ---
    const analysisPeriod = parseInt(bridge_data.design_life || 100);
    const discountRate = parseFloat(financial_data.discount_rate || 0) / 100;
    
    // --- 2. Initial Stage ---
    const initialConstructionCost = parseFloat(construction_work_data.grand_total || 0);
    const superstructureCost = parseFloat(construction_work_data["Super Structure"]?.total || 0);
    
    // Calculate initial carbon cost
    const carbonPrice = parseFloat(financial_data.social_cost_of_carbon || 0);
    const materialEmissions = parseFloat(carbon_emission_data.material_emissions_data?.total_kgCO2e || 0);
    const initialCarbonCost = (materialEmissions / 1000) * carbonPrice; // Price is per MT

    // Initial results structure
    const results = {
        status: "success",
        initial_stage: {
            economic: {
                initial_construction_cost: initialConstructionCost,
                time_cost_of_loan: 0 // Simplified for now
            },
            environmental: {
                initial_material_carbon_emission_cost: initialCarbonCost,
                initial_vehicular_emission_cost: 0
            },
            social: {
                initial_road_user_cost: 0
            }
        },
        use_stage: {
            economic: {
                routine_inspection_costs: 0,
                periodic_maintenance: 0,
                major_inspection_costs: 0,
                major_repair_cost: 0,
                replacement_costs_for_bearing_and_expansion_joint: 0
            },
            environmental: {
                periodic_carbon_costs: 0,
                major_repair_material_carbon_emission_costs: 0,
                major_repair_vehicular_emission_costs: 0,
                vehicular_emission_costs_for_replacement_of_bearing_and_expansion_joint: 0
            },
            social: {
                major_repair_road_user_costs: 0,
                road_user_costs_for_replacement_of_bearing_and_expansion_joint: 0
            }
        },
        end_of_life: {
            economic: {
                total_demolition_and_disposal_costs: 0,
                total_scrap_value: parseFloat(recycling_data.total_recovered_value || 0)
            },
            environmental: {
                carbon_costs_demolition_and_disposal: 0,
                demolition_vehicular_emission_cost: 0
            },
            social: {
                ruc_demolition: 0
            }
        }
    };

    // --- 3. Maintenance Logic (Simplified for Demo) ---
    // In a full implementation, we would loop through years 1 to analysisPeriod
    // and apply discount rates: Cost_PV = Cost / (1 + r)^year
    
    const maintFreq = parseInt(maintenance_data.periodic_maintenance_freq || 5);
    const maintCostPct = parseFloat(maintenance_data.periodic_maintenance_cost || 0) / 100;
    
    let totalMaintPV = 0;
    for (let year = maintFreq; year < analysisPeriod; year += maintFreq) {
        const cost = initialConstructionCost * maintCostPct;
        const pv = cost / Math.pow(1 + discountRate, year);
        totalMaintPV += pv;
    }
    results.use_stage.economic.periodic_maintenance = totalMaintPV;

    // --- 4. Demolition Logic ---
    const demoCostPct = parseFloat(demolition_data.demolition_cost_pct || 0) / 100;
    const demoCost = initialConstructionCost * demoCostPct;
    results.end_of_life.economic.total_demolition_and_disposal_costs = demoCost / Math.pow(1 + discountRate, analysisPeriod);

    return results;
};
