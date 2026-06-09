from __future__ import annotations

import copy

import pytest

from app.adapters.web_to_core import (
    AdapterValidationError,
    calculate_project,
    prepare_for_core,
    validate_project,
)


def test_global_project_prepares_without_gui_dependencies(global_project: dict) -> None:
    prepared = prepare_for_core(global_project, 50)

    assert prepared.input_data["general_parameters"]["discount_rate_percent"] == 6.7
    assert prepared.input_data["general_parameters"]["days_per_month"] == 30
    assert prepared.construction_costs["initial_construction_cost"] == 300_000
    assert prepared.construction_costs["superstructure_construction_cost"] == 200_000
    assert prepared.computed["wpi_required"] is False


def test_missing_required_sections_return_field_specific_errors(global_project: dict) -> None:
    project = copy.deepcopy(global_project)
    project["financial_data"] = {}
    project["maintenance_repair_data"].pop("major_repair_duration")
    project["bridge_data"].pop("days_per_month")
    project["carbon_emission_data"]["transport_emissions_data"] = {}
    project["recycling_data"].pop("total_recovered_value")

    validation = validate_project(project, 50)

    assert "financial_data.discount_rate is required." in validation["errors"]
    assert "maintenance_repair_data.major_repair_duration is required." in validation["errors"]
    assert "bridge_data.days_per_month is required." in validation["errors"]
    assert (
        "carbon_emission_data.transport_emissions_data.total_kgCO2e is required."
        in validation["errors"]
    )
    assert "recycling_data.total_recovered_value is required." in validation["errors"]


def test_empty_canonical_demolition_fields_do_not_pass_via_derived_aliases(
    global_project: dict,
) -> None:
    project = copy.deepcopy(global_project)
    project["demolition_data"].update(
        {
            "demolition_cost": "",
            "demolition_cost_pct": 0,
            "demolition_carbon_cost": "",
            "demolition_carbon_cost_pct": 0,
        }
    )

    errors = validate_project(project, 50)["errors"]

    assert "demolition_data.demolition_cost is required." in errors
    assert "demolition_data.demolition_carbon_cost is required." in errors


def test_zero_percentages_are_valid_but_positive_durations_are_enforced(
    global_project: dict,
) -> None:
    project = copy.deepcopy(global_project)
    project["financial_data"].update(
        {
            "discount_rate": 0,
            "inflation_rate": 0,
            "interest_rate": 0,
            "investment_ratio": 0,
        }
    )
    for key in (
        "routine_inspection_cost",
        "periodic_maintenance_cost",
        "periodic_maintenance_carbon_cost",
        "major_inspection_cost",
        "major_repair_cost",
        "major_repair_carbon_cost",
        "bearing_exp_joint_cost",
    ):
        project["maintenance_repair_data"][key] = 0
    project["demolition_data"]["demolition_cost"] = 0
    project["demolition_data"]["demolition_carbon_cost"] = 0

    assert validate_project(project, 50)["errors"] == []

    project["maintenance_repair_data"]["major_repair_duration"] = 0
    assert (
        "maintenance_repair_data.major_repair_duration must be greater than zero."
        in validate_project(project, 50)["errors"]
    )


def test_india_mode_requires_valid_wpi_when_adt_is_positive(india_project: dict) -> None:
    project = copy.deepcopy(india_project)
    project["traffic_data"]["wpi_data"] = {}

    with pytest.raises(AdapterValidationError, match="traffic_data.wpi is required"):
        prepare_for_core(project, 50)


def test_india_mode_with_zero_adt_does_not_require_wpi(india_project: dict) -> None:
    project = copy.deepcopy(india_project)
    for vehicle in project["traffic_data"]["vehicles"].values():
        vehicle["vehicles_per_day"] = 0
        vehicle["accident_percentage"] = 0
    project["traffic_data"].pop("wpi_data")
    project["traffic_data"].pop("wpi_profile")
    project["traffic_data"].pop("wpi_year")

    prepared = prepare_for_core(project, 50)

    assert prepared.wpi is None
    assert prepared.computed["wpi_required"] is False


def test_global_and_india_projects_calculate(global_project: dict, india_project: dict) -> None:
    global_result = calculate_project(global_project, 50)
    india_result = calculate_project(india_project, 50)

    assert global_result["results"]
    assert india_result["results"]
    assert global_result["validation"]["errors"] == []
    assert india_result["validation"]["errors"] == []
