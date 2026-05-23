/**
 * lifecycleSummary.js
 * Computes summary views from LCCA result dict.
 * Ported from: 3psLCCA-gui/gui/components/outputs/helper_functions/lifecycle_summary.py
 */

/**
 * Sum all numeric values in a dict, treating scrap value as a credit.
 */
function sumDict(d) {
    if (!d || typeof d !== 'object') return 0;
    let total = 0;
    for (const [k, v] of Object.entries(d)) {
        if (k === 'total_scrap_value') {
            total -= v; // scrap value is a recovery/credit
        } else {
            total += v;
        }
    }
    return total;
}

/**
 * Given one stage's data dict, return its three pillar sub-totals.
 */
function stageTotals(stageData) {
    return {
        eco: sumDict(stageData?.economic || {}),
        env: sumDict(stageData?.environmental || {}),
        social: sumDict(stageData?.social || {}),
    };
}

/**
 * Compute summary views from LCCA result dict.
 * 
 * NOTE: "use_stage" and "reconstruction" are merged into a single
 * "use_reconstruction" group in all outputs.
 * 
 * @param {Object} data - The raw LCCA results dict
 * @returns {Object} { stagewise, pillar_wise, pillar_totals, environmental_split }
 */
export function computeAllSummaries(data) {
    // Step 1: Compute per-stage pillar totals
    const stages = {};
    for (const k of ['initial_stage', 'use_stage', 'reconstruction', 'end_of_life']) {
        stages[k] = stageTotals(data[k] || {});
    }

    // Helper: sum all three pillars for a single raw stage key
    const totalOf = (stageKey) => {
        const s = stages[stageKey] || {};
        return (s.eco || 0) + (s.env || 0) + (s.social || 0);
    };

    // 1) Stagewise (Merged)
    const stagewise = {
        initial: totalOf('initial_stage'),
        use_reconstruction: totalOf('use_stage') + totalOf('reconstruction'),
        end_of_life: totalOf('end_of_life'),
    };

    // 2) Pillar-wise (Merged)
    const pillar_wise = {
        initial: stages.initial_stage,
        use_reconstruction: {
            eco: stages.use_stage.eco + stages.reconstruction.eco,
            env: stages.use_stage.env + stages.reconstruction.env,
            social: stages.use_stage.social + stages.reconstruction.social,
        },
        end_of_life: stages.end_of_life,
    };

    // 3) Pillar totals (lifetime)
    const pillar_totals = { eco: 0, env: 0, social: 0 };
    for (const s of Object.values(stages)) {
        pillar_totals.eco += s.eco || 0;
        pillar_totals.env += s.env || 0;
        pillar_totals.social += s.social || 0;
    }

    // 4) Environmental split
    const environmental_split = {
        initial: stages.initial_stage.env,
        use_reconstruction: stages.use_stage.env + stages.reconstruction.env,
        end_of_life: stages.end_of_life.env,
    };

    return {
        stagewise,
        pillar_wise,
        pillar_totals,
        environmental_split,
    };
}
