/**
 * lccColors.js
 * Single source of truth for all chart/table colors in the outputs section.
 * Ported from: 3psLCCA-gui/gui/components/outputs/helper_functions/lcc_colors.py
 */

export const COLORS = {
    // Pillar colors (cost categories) - Vibrant but balanced
    eco_color: '#4361ee', // Modern Blue
    env_color: '#06d6a0', // Emerald Green
    soc_color: '#f72585', // Vivid Rose

    // Stage colors (life-cycle phases)
    init_color: '#3f37c9', // Deep Blue
    use_color: '#4cc9f0',  // Sky Blue
    end_color: '#b5179e',  // Purple
    recon_color: '#7209b7', // Violet

    // Material colors
    steel_color: '#6E0902',
    concrete_color: '#4B4B4B',
};

export const PILLAR_COLORS = {
    economic: COLORS.eco_color,
    environmental: COLORS.env_color,
    social: COLORS.soc_color,
};

export const STAGE_COLORS = {
    initial_stage: COLORS.init_color,
    use_stage: COLORS.use_color,
    reconstruction: COLORS.recon_color,
    end_of_life: COLORS.end_color,
};

