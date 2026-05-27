/**
 * Maps project-creation form fields to general_info schema.
 */
export function mapCreationToGeneralInfo({ name, country, currency, unitSystem }) {
    return {
        project_name: name || '',
        project_country: country || '',
        project_currency: currency || '',
        unit_system: unitSystem || '',
    };
}

/**
 * Backfills general_info from root-level creation fields for legacy projects.
 */
export function backfillGeneralInfo(project) {
    if (!project) return project;

    const gi = project.general_info || {};
    const hasLockedFields =
        gi.project_country || gi.project_currency || gi.unit_system;

    if (hasLockedFields) {
        if (!gi.project_name && project.name) {
            return {
                ...project,
                general_info: { ...gi, project_name: project.name },
            };
        }
        return project;
    }

    const fromRoot = project.country || project.currency || project.unitSystem;
    if (!fromRoot && !project.name) return project;

    return {
        ...project,
        general_info: {
            ...gi,
            project_name: gi.project_name || project.name || '',
            project_country: gi.project_country || project.country || '',
            project_currency: gi.project_currency || project.currency || '',
            unit_system: gi.unit_system || project.unitSystem || '',
        },
    };
}

const EMPTY_SECTIONS = {
    bridge_data: {},
    financial_data: {},
    traffic_data: {},
    construction_work_data: { 'Super Structure': { total: 0 }, grand_total: 0 },
    carbon_emission_data: {},
    maintenance_data: {},
    demolition_data: {},
    recycling_data: {},
};

/**
 * Builds a full project object from creation modal payload.
 */
export function buildProjectFromCreation(creationData) {
    const general_info = mapCreationToGeneralInfo(creationData);

    return {
        name: creationData.name,
        country: creationData.country,
        currency: creationData.currency,
        unitSystem: creationData.unitSystem,
        createdAt: creationData.createdAt || new Date().toISOString(),
        general_info,
        ...EMPTY_SECTIONS,
    };
}
