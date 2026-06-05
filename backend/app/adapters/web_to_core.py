from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


WORKSPACE_ROOT = Path(__file__).resolve().parents[3].parent
CORE_SRC = WORKSPACE_ROOT / "3psLCCA-gui-python-venv" / "3psLCCA-core" / "src"
if CORE_SRC.exists() and str(CORE_SRC) not in sys.path:
    sys.path.insert(0, str(CORE_SRC))

from three_ps_lcca_core.core.main import run_full_lcc_analysis
from three_ps_lcca_core.inputs.input import InputMetaData
from three_ps_lcca_core.inputs.input_global import InputGlobalMetaData
from three_ps_lcca_core.inputs.wpi import WPIMetaData


VEHICLE_TYPES = (
    "small_cars",
    "big_cars",
    "two_wheelers",
    "o_buses",
    "d_buses",
    "lcv",
    "hcv",
    "mcv",
)


DEFAULT_ACCIDENT_PERCENTAGES = {
    "small_cars": 20.0,
    "big_cars": 20.0,
    "two_wheelers": 20.0,
    "o_buses": 10.0,
    "d_buses": 5.0,
    "lcv": 10.0,
    "hcv": 10.0,
    "mcv": 5.0,
}


@dataclass
class PreparedCorePayload:
    input_data: dict[str, Any]
    construction_costs: dict[str, Any]
    wpi: dict[str, Any] | None
    computed: dict[str, Any]
    warnings: list[str]


class AdapterValidationError(ValueError):
    def __init__(self, errors: list[str], warnings: list[str] | None = None):
        super().__init__("; ".join(errors))
        self.errors = errors
        self.warnings = warnings or []


def _as_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _num(value: Any, default: float = 0.0) -> float:
    if value is None or value == "":
        return default
    try:
        return float(str(value).replace(",", "").replace("%", "").strip())
    except (TypeError, ValueError):
        return default


def _positive(value: Any, default: float) -> float:
    parsed = _num(value, default)
    return parsed if parsed > 0 else default


def _sum_section_rows(sections: Any) -> float:
    total = 0.0
    for section in _as_list(sections):
        for row in _as_list(_as_dict(section).get("rows")):
            row_data = _as_dict(row)
            total += _num(row_data.get("rate")) * _num(row_data.get("qty"))
    return total


def _construction_data(project: dict[str, Any]) -> dict[str, Any]:
    existing = _as_dict(project.get("construction_work_data"))
    foundation = _num(_as_dict(existing.get("Foundation")).get("total")) or _sum_section_rows(project.get("foundation_data"))
    substructure = _num(_as_dict(existing.get("Sub Structure")).get("total")) or _sum_section_rows(project.get("substructure_data"))
    superstructure = _num(_as_dict(existing.get("Super Structure")).get("total")) or _sum_section_rows(project.get("superstructure_data"))
    miscellaneous = _num(_as_dict(existing.get("Miscellaneous")).get("total")) or _sum_section_rows(project.get("miscellaneous_data"))
    grand_total = _num(existing.get("grand_total")) or foundation + substructure + superstructure + miscellaneous
    return {
        "foundation_total": foundation,
        "substructure_total": substructure,
        "superstructure_total": superstructure,
        "miscellaneous_total": miscellaneous,
        "grand_total": grand_total,
    }


def _material_carbon_total(project: dict[str, Any]) -> float:
    carbon = _as_dict(project.get("carbon_emission_data"))
    material = _as_dict(carbon.get("material_emissions_data"))
    total = _num(material.get("total_kgCO2e"))
    if total:
        return total

    excluded_ids = set(_as_list(material.get("excluded_ids")))
    total_kg = 0.0
    for chunk_key in ("foundation_data", "substructure_data", "superstructure_data", "miscellaneous_data"):
        for section in _as_list(project.get(chunk_key)):
            for row in _as_list(_as_dict(section).get("rows")):
                row_data = _as_dict(row)
                row_id = f"{chunk_key}-{row_data.get('id')}"
                if row_id in excluded_ids:
                    continue
                carbon_emission = _as_dict(row_data.get("carbonEmission"))
                total_kg += _num(row_data.get("qty")) * (_num(row_data.get("conversionFactor"), 1.0) or 1.0) * _num(carbon_emission.get("factor"))
    return total_kg


def _recycling_total(project: dict[str, Any]) -> float:
    recycling = _as_dict(project.get("recycling_data"))
    total = _num(recycling.get("total_recovered_value"))
    if total:
        return total
    return sum(_num(_as_dict(item).get("recoveredValue")) for item in _as_list(recycling.get("included")))


def _general_parameters(project: dict[str, Any], analysis_period_years: int, use_global: bool) -> dict[str, Any]:
    bridge = _as_dict(project.get("bridge_data"))
    financial = _as_dict(project.get("financial_data"))
    carbon = _as_dict(project.get("carbon_emission_data"))
    social = _as_dict(carbon.get("social_cost_data"))

    return {
        "service_life_years": int(_positive(bridge.get("service_life") or bridge.get("design_life"), 50)),
        "analysis_period_years": int(_positive(analysis_period_years or bridge.get("design_life"), 50)),
        "discount_rate_percent": _num(financial.get("discount_rate"), 6.7),
        "inflation_rate_percent": _num(financial.get("inflation_rate"), 5.15),
        "interest_rate_percent": _num(financial.get("interest_rate"), 7.75),
        "investment_ratio": _num(financial.get("investment_ratio"), 0.5),
        "social_cost_of_carbon_per_mtco2e": _num(
            _as_dict(social.get("result")).get("cost_of_carbon_local")
            or social.get("cost_of_carbon_local")
            or social.get("calculated_scc_local"),
            0.0,
        ) * 1000,
        "currency_conversion": _positive(social.get("currency_conversion"), 1.0),
        "construction_period_months": _positive(bridge.get("duration_construction_months"), 1.0),
        "working_days_per_month": int(_positive(bridge.get("working_days_per_month"), 22)),
        "days_per_month": 30,
        "use_global_road_user_calculations": use_global,
    }


def _maintenance_stage(project: dict[str, Any]) -> dict[str, Any]:
    maintenance = _as_dict(project.get("maintenance_repair_data") or project.get("maintenance_data"))
    demolition = _as_dict(project.get("demolition_data"))
    return {
        "use_stage_cost": {
            "routine": {
                "inspection": {
                    "percentage_of_initial_construction_cost_per_year": _num(maintenance.get("routine_inspection_cost"), 0.1),
                    "interval_in_years": int(_positive(maintenance.get("routine_inspection_freq"), 1)),
                },
                "maintenance": {
                    "percentage_of_initial_construction_cost_per_year": _num(maintenance.get("periodic_maintenance_cost"), 0.55),
                    "percentage_of_initial_carbon_emission_cost": _num(maintenance.get("periodic_maintenance_carbon_cost"), 0.55),
                    "interval_in_years": int(_positive(maintenance.get("periodic_maintenance_freq"), 5)),
                },
            },
            "major": {
                "inspection": {
                    "percentage_of_initial_construction_cost": _num(maintenance.get("major_inspection_cost"), 0.5),
                    "interval_for_repair_and_rehabitation_in_years": int(_positive(maintenance.get("major_inspection_freq"), 5)),
                },
                "repair": {
                    "percentage_of_initial_construction_cost": _num(maintenance.get("major_repair_cost"), 10.0),
                    "percentage_of_initial_carbon_emission_cost": _num(maintenance.get("major_repair_carbon_cost"), 0.55),
                    "interval_for_repair_and_rehabitation_in_years": int(_positive(maintenance.get("major_repair_freq"), 20)),
                    "repairs_duration_months": _positive(maintenance.get("major_repair_duration"), 3.0),
                },
            },
            "replacement_costs_for_bearing_and_expansion_joint": {
                "percentage_of_super_structure_cost": _num(maintenance.get("bearing_exp_joint_cost"), 12.5),
                "interval_of_replacement_in_years": int(_positive(maintenance.get("bearing_exp_joint_freq"), 25)),
                "duration_of_replacement_in_days": int(_positive(maintenance.get("bearing_exp_joint_duration"), 2)),
            },
        },
        "end_of_life_stage_costs": {
            "demolition_and_disposal": {
                "percentage_of_initial_construction_cost": _num(demolition.get("demolition_cost_pct") or demolition.get("demolition_cost"), 10.0),
                "percentage_of_initial_carbon_emission_cost": _num(demolition.get("demolition_carbon_cost_pct") or demolition.get("demolition_carbon_cost"), 10.0),
                "duration_for_demolition_and_disposal_in_months": _positive(demolition.get("demolition_duration"), 1.0),
            }
        },
    }


def _traffic_data(project: dict[str, Any]) -> dict[str, Any]:
    traffic = _as_dict(project.get("traffic_and_road_data") or project.get("traffic_data"))
    carbon = _as_dict(project.get("carbon_emission_data"))
    diversion = _as_dict(carbon.get("diversion_emissions_data"))
    factors = _as_dict(diversion.get("factors"))
    vehicle_data = _as_dict(traffic.get("vehicle_data"))
    vehicles_per_day = _as_dict(traffic.get("vehicles_per_day"))

    vehicles = {}
    total_adt = 0
    for key in VEHICLE_TYPES:
        row = _as_dict(vehicle_data.get(key))
        vehicles_per_day_value = int(_num(row.get("vehicles_per_day") or row.get("adt") or vehicles_per_day.get(key), 0))
        total_adt += vehicles_per_day_value
        vehicles[key] = {
            "vehicles_per_day": vehicles_per_day_value,
            "carbon_emissions_kgCO2e_per_km": _num(row.get("carbon_emissions_kgCO2e_per_km") or row.get("emission_factor") or factors.get(key), 0.0),
            "accident_percentage": _num(row.get("accident_percentage"), DEFAULT_ACCIDENT_PERCENTAGES[key]),
            "pwr": _positive(row.get("pwr"), 1.0) if key in {"hcv", "mcv"} and vehicles_per_day_value > 0 else row.get("pwr"),
        }

    peak = traffic.get("peak_hour_traffic_percent_per_hour") or traffic.get("peak_hour_distribution") or []
    if isinstance(peak, dict):
        peak = [value for _, value in sorted(peak.items())]
    peak_values = [_num(value) for value in peak if _num(value) > 0]
    if not peak_values:
        peak_values = [0.08, 0.08, 0.08]

    return {
        "vehicle_data": vehicles,
        "total_adt": total_adt,
        "accident_severity_distribution": {
            "minor": _num(traffic.get("severity_minor"), 60.0),
            "major": _num(traffic.get("severity_major"), 30.0),
            "fatal": _num(traffic.get("severity_fatal"), 10.0),
        },
        "additional_inputs": {
            "alternate_road_carriageway": str(traffic.get("alternate_road_carriageway") or "Two Lane"),
            "carriage_width_in_m": _positive(traffic.get("carriage_width_in_m"), 7.0),
            "road_roughness_mm_per_km": _positive(traffic.get("road_roughness_mm_per_km"), 3000.0),
            "road_rise_m_per_km": _num(traffic.get("road_rise_m_per_km"), 0.0),
            "road_fall_m_per_km": _num(traffic.get("road_fall_m_per_km"), 0.0),
            "additional_reroute_distance_km": _num(traffic.get("additional_reroute_distance_km") or diversion.get("reroute_km"), 0.0),
            "additional_travel_time_min": _num(traffic.get("additional_travel_time_min"), 0.0),
            "crash_rate_accidents_per_million_km": _num(traffic.get("crash_rate_accidents_per_million_km"), 0.0),
            "work_zone_multiplier": _num(traffic.get("work_zone_multiplier"), 0.5),
            "peak_hour_traffic_percent_per_hour": peak_values,
            "hourly_capacity": int(_positive(traffic.get("hourly_capacity"), 1500)),
            "force_free_flow_off_peak": bool(traffic.get("force_free_flow_off_peak", False)),
        },
    }


def _wpi(project: dict[str, Any]) -> dict[str, Any] | None:
    traffic = _as_dict(project.get("traffic_and_road_data") or project.get("traffic_data"))
    raw = _as_dict(traffic.get("wpi"))
    if raw.get("year") and raw.get("WPI"):
        return raw
    year = int(_positive(raw.get("selected_profile_year") or traffic.get("wpi_profile"), 2024))
    snapshot = raw.get("data_snapshot") or traffic.get("wpi_data")
    if not isinstance(snapshot, dict):
        return None
    return {"year": year, "WPI": snapshot}


def _global_daily_ruc(project: dict[str, Any]) -> dict[str, Any]:
    traffic = _as_dict(project.get("traffic_and_road_data") or project.get("traffic_data"))
    carbon = _as_dict(project.get("carbon_emission_data"))
    diversion = _as_dict(carbon.get("diversion_emissions_data"))
    return {
        "total_daily_ruc": _num(traffic.get("road_user_cost_per_day"), 0.0),
        "total_carbon_emission": {
            "total_emission_kgCO2e": _num(
                diversion.get("total_kgCO2e_per_day")
                or diversion.get("total_direct_emissions")
                or diversion.get("total_calculated_emissions"),
                0.0,
            )
        },
    }


def prepare_for_core(project: dict[str, Any], analysis_period_years: int) -> PreparedCorePayload:
    errors: list[str] = []
    warnings: list[str] = []
    project = _as_dict(project)
    bridge = _as_dict(project.get("bridge_data"))
    traffic = _as_dict(project.get("traffic_and_road_data") or project.get("traffic_data"))
    use_global = (traffic.get("mode") or traffic.get("calculation_mode") or "GLOBAL") == "GLOBAL"

    if not bridge.get("bridge_name"):
        errors.append("bridge_data.bridge_name is required.")

    construction = _construction_data(project)
    if construction["grand_total"] <= 0:
        errors.append("construction cost total is required. Fill Construction Work Data before calculating.")

    material_kg = _material_carbon_total(project)
    carbon = _as_dict(project.get("carbon_emission_data"))
    social = _as_dict(carbon.get("social_cost_data"))
    scc = _num(_as_dict(social.get("result")).get("cost_of_carbon_local") or social.get("cost_of_carbon_local") or social.get("calculated_scc_local"))
    initial_carbon_cost = material_kg * scc

    general_parameters = _general_parameters(project, analysis_period_years, use_global)
    maintenance_stage = _maintenance_stage(project)

    if errors:
        raise AdapterValidationError(errors, warnings)

    input_data: dict[str, Any] = {
        "general_parameters": general_parameters,
        "maintenance_and_stage_parameters": maintenance_stage,
    }
    wpi = None

    if use_global:
        input_data["daily_road_user_cost_with_vehicular_emissions"] = _global_daily_ruc(project)
        InputGlobalMetaData.from_dict(input_data)
    else:
        core_traffic = _traffic_data(project)
        input_data["traffic_and_road_data"] = {
            "vehicle_data": core_traffic["vehicle_data"],
            "accident_severity_distribution": core_traffic["accident_severity_distribution"],
            "additional_inputs": core_traffic["additional_inputs"],
        }
        if core_traffic["total_adt"] > 0:
            wpi = _wpi(project)
            if wpi is None:
                raise AdapterValidationError(["traffic_data.wpi is required for INDIA mode when total ADT is greater than zero."], warnings)
            WPIMetaData.from_dict(wpi)
        InputMetaData.from_dict(input_data)

    construction_costs = {
        "initial_construction_cost": construction["grand_total"],
        "initial_carbon_emissions_cost": initial_carbon_cost,
        "superstructure_construction_cost": construction["superstructure_total"],
        "total_scrap_value": _recycling_total(project),
    }

    computed = {
        "construction": construction,
        "material_emissions_kgCO2e": material_kg,
        "initial_carbon_emissions_cost": initial_carbon_cost,
        "total_scrap_value": construction_costs["total_scrap_value"],
        "use_global_road_user_calculations": use_global,
        "wpi_required": not use_global,
    }
    return PreparedCorePayload(input_data=input_data, construction_costs=construction_costs, wpi=wpi, computed=computed, warnings=warnings)


def validate_project(project: dict[str, Any], analysis_period_years: int) -> dict[str, list[str]]:
    try:
        prepared = prepare_for_core(project, analysis_period_years)
        return {"errors": [], "warnings": prepared.warnings}
    except AdapterValidationError as exc:
        return {"errors": exc.errors, "warnings": exc.warnings}
    except Exception as exc:  # Core dataclass validation errors should be user-visible.
        return {"errors": [str(exc)], "warnings": []}


def calculate_project(project: dict[str, Any], analysis_period_years: int, debug: bool = False) -> dict[str, Any]:
    prepared = prepare_for_core(project, analysis_period_years)
    results = run_full_lcc_analysis(
        prepared.input_data,
        prepared.construction_costs.copy(),
        wpi=prepared.wpi,
        debug=debug,
    )
    return {
        "results": results,
        "computed": prepared.computed,
        "validation": {
            "errors": [],
            "warnings": prepared.warnings + list(results.get("warnings", [])),
        },
    }
