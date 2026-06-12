from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest


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


@pytest.fixture
def global_project() -> dict:
    return {
        "bridge_data": {
            "bridge_name": "Regression Bridge",
            "design_life": 50,
            "analysis_period": 50,
            "duration_construction_months": 18,
            "working_days_per_month": 22,
            "days_per_month": 30,
        },
        "financial_data": {
            "discount_rate": 6.7,
            "inflation_rate": 5.15,
            "interest_rate": 7.75,
            "investment_ratio": 0.5,
        },
        "foundation_data": [
            {
                "name": "Foundation",
                "rows": [
                    {
                        "id": "foundation-1",
                        "workName": "Pile foundation",
                        "rate": 1000,
                        "qty": 100,
                        "conversionFactor": 1,
                        "carbonEmission": {"factor": 2},
                    }
                ],
            }
        ],
        "superstructure_data": [
            {
                "name": "Superstructure",
                "rows": [
                    {
                        "id": "superstructure-1",
                        "workName": "Deck",
                        "rate": 2000,
                        "qty": 100,
                        "conversionFactor": 1,
                        "carbonEmission": {"factor": 3},
                    }
                ],
            }
        ],
        "carbon_emission_data": {
            "material_emissions_data": {"total_kgCO2e": 500},
            "transport_emissions_data": {"total_kgCO2e": 100},
            "machinery_emissions_data": {"total_kgCO2e": 50},
            "diversion_emissions_data": {
                "mode": "direct",
                "total_direct_emissions": 25,
            },
            "social_cost_data": {
                "result": {"cost_of_carbon_local": 0.08},
            },
        },
        "maintenance_repair_data": {
            "routine_inspection_cost": 0.1,
            "routine_inspection_freq": 1,
            "periodic_maintenance_cost": 0.55,
            "periodic_maintenance_carbon_cost": 0.55,
            "periodic_maintenance_freq": 5,
            "major_inspection_cost": 0.5,
            "major_inspection_freq": 5,
            "major_repair_cost": 10,
            "major_repair_carbon_cost": 0.55,
            "major_repair_freq": 20,
            "major_repair_duration": 3,
            "bearing_exp_joint_cost": 12.5,
            "bearing_exp_joint_freq": 25,
            "bearing_exp_joint_duration": 2,
        },
        "demolition_data": {
            "demolition_cost": 10,
            "demolition_carbon_cost": 10,
            "demolition_duration": 1,
        },
        "recycling_data": {
            "included": [{"recoveredValue": 5000}],
            "total_recovered_value": 5000,
        },
        "traffic_data": {
            "calculation_mode": "GLOBAL",
            "road_user_cost_per_day": 2500,
        },
    }


@pytest.fixture
def india_project(global_project: dict) -> dict:
    project = copy.deepcopy(global_project)
    wpi_path = Path(__file__).resolve().parents[2] / "src" / "data" / "wpi_db.json"
    wpi_database = json.loads(wpi_path.read_text(encoding="utf-8"))
    wpi_entry = next(
        entry for entry in wpi_database["entries"] if entry["metadata"]["name"] == "2024"
    )

    vehicles = {
        vehicle: {
            "vehicles_per_day": 0,
            "accident_percentage": 0,
            "pwr": 7.22 if vehicle == "hcv" else 8.0 if vehicle == "mcv" else 0,
        }
        for vehicle in VEHICLE_TYPES
    }
    vehicles["small_cars"].update(
        {
            "vehicles_per_day": 100,
            "accident_percentage": 100,
        }
    )

    project["traffic_data"] = {
        "calculation_mode": "INDIA",
        "vehicles": vehicles,
        "severity": {
            "severity_minor": 60,
            "severity_major": 30,
            "severity_fatal": 10,
        },
        "alternate_road": {
            "alternate_road_carriageway": "Two Lane (Two Way)",
            "carriage_width_in_m": 7,
            "hourly_capacity": 2400,
        },
        "road_params": {
            "road_roughness_mm_per_km": 2000,
            "road_rise_m_per_km": 0,
            "road_fall_m_per_km": 0,
            "additional_reroute_distance_km": 2,
            "additional_travel_time_min": 10,
            "crash_rate_accidents_per_million_km": 0.5,
            "work_zone_multiplier": 0.5,
        },
        "peak_distribution": {
            "hour_1": 0.1,
            "hour_2": 0.1,
        },
        "force_free_flow": True,
        "wpi_profile": "2024",
        "wpi_year": "2024",
        "wpi_data": wpi_entry["data"],
    }
    return project
