import React, { useState, useEffect, useRef } from 'react';
import { useProjectData } from '../../../contexts/ProjectDataContext';
import { Container, Row, Col, Card, Button, Form, Table, Badge } from 'react-bootstrap';
import * as d3 from 'd3';
import JSZip from 'jszip';
import pako from 'pako';
import { FaExclamationTriangle, FaCheckCircle, FaFileDownload, FaFileUpload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { COLORS, PILLAR_COLORS, STAGE_COLORS } from './lccColors';
import { BREAKDOWN_STAGES, STAGE_DEFS, computeStagePillarTotals } from './breakdownStages';
import { computeAllSummaries } from './lifecycleSummary';
import { generateFullReport } from './reportGenerator';
import ReportSectionModal from './ReportSectionModal';

const D3PieChart = ({ data }) => {
    const svgRef = useRef();
    const tooltipRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        // Increased width and adjusted layout to prevent legend overlap
        const w = 520;
        const h = 300;
        const margin = 20;
        const radius = Math.min(w, h) / 2 - margin;

        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();

        const tooltip = d3.select(tooltipRef.current);

        const svg = svgEl
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${w} ${h}`)
            .append("g")
            // Shift center to the left to make room for legend
            .attr("transform", `translate(${w / 2 - 50},${h / 2})`);

        const pie = d3.pie()
            .value(d => d.value)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius);

        const arcs = svg.selectAll("arc")
            .data(pie(data))
            .enter()
            .append("g");

        arcs.append("path")
            .attr("d", arc)
            .attr("fill", d => d.data.color)
            .attr("stroke", "var(--app-bg-card)")
            .style("stroke-width", "2px")
            .style("cursor", "pointer")
            .style("opacity", 0.9)
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .transition().duration(200)
                    .style("opacity", 1)
                    .attr("d", d3.arc().innerRadius(radius * 0.5).outerRadius(radius * 1.05));
                
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.data.name}</strong><br/>Value: ${d.value}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                    .transition().duration(200)
                    .style("opacity", 0.9)
                    .attr("d", arc);
                
                tooltip.style("opacity", 0);
            })
            .transition()
            .duration(800)
            .attrTween("d", function(d) {
                const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return function(t) { return arc(i(t)); };
            });
            
        // Add legend with more horizontal spacing
        const legend = svg.append("g")
            .attr("transform", `translate(${radius + 30}, -${radius * 0.5})`);
            
        data.forEach((d, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 28})`);
                
            legendRow.append("rect")
                .attr("width", 12)
                .attr("height", 12)
                .attr("rx", 2)
                .attr("fill", d.color);
                
            legendRow.append("text")
                .attr("x", 20)
                .attr("y", 11)
                .attr("text-anchor", "start")
                .style("fill", "var(--app-text-primary)")
                .style("font-size", "12px")
                .style("font-weight", "500")
                .text(d.name);
        });

    }, [data]);

    return (
        <div className="position-relative w-100 h-100">
            <svg ref={svgRef}></svg>
            <div 
                ref={tooltipRef} 
                style={{
                    position: 'absolute',
                    opacity: 0,
                    backgroundColor: 'var(--app-bg-card)',
                    border: '1px solid var(--app-border-mid)',
                    color: 'var(--app-text-primary)',
                    padding: '8px',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'opacity 0.2s',
                    zIndex: 10
                }}
            ></div>
        </div>
    );
};

const D3BarChart = ({ data }) => {
    const svgRef = useRef();
    const tooltipRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        const w = 450;
        const h = 300;
        const margin = { top: 20, right: 20, bottom: 60, left: 50 };
        const width = w - margin.left - margin.right;
        const height = h - margin.top - margin.bottom;

        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();

        const tooltip = d3.select(tooltipRef.current);

        const svg = svgEl
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${w} ${h}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(data.map(d => d.name))
            .range([0, width])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value) * 1.1]) // add some top padding
            .nice()
            .range([height, 0]);

        // Add grid lines
        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .tickSize(-width)
                .tickFormat("")
            )
            .selectAll("line")
            .style("stroke", "var(--app-border-light)")
            .style("stroke-dasharray", "3 3");
            
        svg.selectAll(".domain").remove(); // remove axis borders if desired

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("fill", "var(--app-text-muted)")
            .style("font-size", "11px")
            .attr("transform", "rotate(-25)")
            .style("text-anchor", "end");

        svg.append("g")
            .call(d3.axisLeft(y).ticks(5))
            .selectAll("text")
            .style("fill", "var(--app-text-muted)")
            .style("font-size", "11px");

        // Add Bars
        svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.name))
            .attr("y", y(0))
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .attr("fill", d => d.color || 'var(--app-primary-accent)')
            .attr("rx", 4)
            .attr("ry", 4)
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .transition().duration(200)
                    .attr("opacity", 0.8);
                    
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.name}</strong><br/>Value: ${d.value}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                    .transition().duration(200)
                    .attr("opacity", 1);
                    
                tooltip.style("opacity", 0);
            })
            .transition()
            .duration(800)
            .attr("y", d => y(d.value))
            .attr("height", d => height - y(d.value));

    }, [data]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <svg ref={svgRef}></svg>
            <div 
                ref={tooltipRef} 
                style={{
                    position: 'absolute',
                    opacity: 0,
                    backgroundColor: 'var(--app-bg-card)',
                    border: '1px solid var(--app-border-mid)',
                    color: 'var(--app-text-primary)',
                    padding: '8px',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'opacity 0.2s',
                    zIndex: 10
                }}
            ></div>
        </div>
    );
};

import { runLccaCalculation } from './calculationEngine';

const Outputs = ({ addLog, isLocked, navTrigger }) => {
    const { projectData } = useProjectData();

    // Helper to calculate totals from structured section list (Foundation, Sub, Super, Misc)
    const getSectionsTotal = (sections) => {
        if (!sections || !Array.isArray(sections)) return 0;
        return sections.reduce((sum, sec) => {
            if (!sec.rows || !Array.isArray(sec.rows)) return sum;
            return sum + sec.rows.reduce((s, r) => s + (parseFloat(r.rate) || 0) * (parseFloat(r.qty) || 0), 0);
        }, 0);
    };

    // Helper to calculate scrap value from Recycling included list
    const getRecyclingTotal = (recyclingData) => {
        if (!recyclingData || !recyclingData.included || !Array.isArray(recyclingData.included)) return 0;
        return recyclingData.included.reduce((sum, item) => {
            const val = parseFloat(String(item.recoveredValue).replace(/,/g, '')) || 0;
            return sum + val;
        }, 0);
    };

    // Dynamically derive projectInputs from context
    const derivedProjectInputs = React.useMemo(() => {
        if (!projectData) return null;
        
        const construction_work_data = {
            "Foundation": { total: getSectionsTotal(projectData.foundation_data) },
            "Sub Structure": { total: getSectionsTotal(projectData.substructure_data) },
            "Super Structure": { total: getSectionsTotal(projectData.superstructure_data) },
            "Miscellaneous": { total: getSectionsTotal(projectData.miscellaneous_data) },
            grand_total: getSectionsTotal(projectData.foundation_data) +
                        getSectionsTotal(projectData.substructure_data) +
                        getSectionsTotal(projectData.superstructure_data) +
                        getSectionsTotal(projectData.miscellaneous_data)
        };

        const recycling_data = {
            ...projectData.recycling_data,
            total_recovered_value: getRecyclingTotal(projectData.recycling_data)
        };

        const demolition_data = {
            ...projectData.demolition_data,
            demolition_cost_pct: parseFloat(projectData.demolition_data?.demolition_cost) || 0
        };

        return {
            bridge_data: projectData.bridge_data || {},
            financial_data: projectData.financial_data || {},
            traffic_data: projectData.traffic_data || {},
            construction_work_data,
            carbon_emission_data: projectData.carbon_emission_data || {},
            maintenance_data: projectData.maintenance_repair_data || {},
            demolition_data,
            recycling_data
        };
    }, [projectData]);

    const projectInputs = derivedProjectInputs;

    const [view, setView] = useState('validation'); // 'validation' or 'results'
    const [analysisPeriod, setAnalysisPeriod] = useState(100);
    const [uploadedResults, setUploadedResults] = useState(null);
    const [fileError, setFileError] = useState(null);
    const [computedData, setComputedData] = useState(null);
    const [uploadedFileName, setUploadedFileName] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const reportRef = useRef();
    const pieChartRef = useRef();
    const barChartRef = useRef();
    const fileInputRef = useRef();
    const LCCA_MAGIC = [0x4C, 0x43, 0x43, 0x41]; // "LCCA"

    useEffect(() => {
        if (projectData?.bridge_data?.design_life) {
            setAnalysisPeriod(parseInt(projectData.bridge_data.design_life) || 100);
        }
    }, [projectData?.bridge_data?.design_life]);

    // Use live data if no file is uploaded
    const resultsToUse = uploadedResults || (projectInputs && runLccaCalculation(projectInputs));

    const decodeLcca = (uint8) => {
        // Check for "LCCA" magic header
        const isLcca = uint8[0] === LCCA_MAGIC[0] && uint8[1] === LCCA_MAGIC[1] && 
                       uint8[2] === LCCA_MAGIC[2] && uint8[3] === LCCA_MAGIC[3];
        
        if (isLcca) {
            // Compressed: Magic (4 bytes) + Zlib data
            const compressed = uint8.slice(4);
            const decompressed = pako.inflate(compressed);
            const text = new TextDecoder().decode(decompressed);
            return JSON.parse(text);
        } else {
            // Plain JSON
            const text = new TextDecoder().decode(uint8);
            return JSON.parse(text);
        }
    };

    useEffect(() => {
        // Reset to validation view whenever a navigation trigger occurs
        setView('validation');
    }, [navTrigger]);

    useEffect(() => {
        // Process either uploaded results or live inputs to ensure summary data is available
        const dataToProcess = uploadedResults || (projectInputs ? runLccaCalculation(projectInputs) : null);
        if (dataToProcess) {
            const summaries = computeAllSummaries(dataToProcess);
            setComputedData(summaries);
        }
    }, [projectInputs, uploadedResults]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadedFileName(file.name);
        addLog(`Reading file: ${file.name}...`);
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;
            const uint8 = new Uint8Array(arrayBuffer);
            
            // Check for ZIP signature (PK\x03\x04)
            const isZip = uint8[0] === 0x50 && uint8[1] === 0x4B && uint8[2] === 0x03 && uint8[3] === 0x04;
            
            try {
                let json;
                if (isZip) {
                    addLog("Detected ZIP archive. Unzipping project data...");
                    const zip = await JSZip.loadAsync(arrayBuffer);
                    const outputFile = zip.file("chunks/outputs_data.lcca");
                    
                    if (outputFile) {
                        const content = await outputFile.async("uint8array");
                        json = decodeLcca(content);
                        addLog("Extracted and decoded outputs from project archive.");
                    } else {
                        throw new Error("Missing 'chunks/outputs_data.lcca' in archive.");
                    }
                } else {
                    // Try decoding as LCCA binary or plain JSON
                    json = decodeLcca(uint8);
                }

                // Flexible results detection
                const candidateResults = json.results || 
                                       (json.data && (json.data.results || json.data)) || 
                                       (json.chunks?.outputs_data?.results || json.chunks?.outputs_data) ||
                                       json;
                
                if (candidateResults.initial_stage || candidateResults.results || candidateResults.status === "success") {
                    const finalResults = candidateResults.results || candidateResults;
                    setUploadedResults(finalResults);
                    setFileError(null);
                    addLog(`File "${file.name}" loaded successfully.`);
                    
                    const summaries = computeAllSummaries(finalResults);
                    setComputedData(summaries);
                } else {
                    const keys = Object.keys(json).join(", ");
                    setFileError(`Invalid file format. Keys found: [${keys}].`);
                }
            } catch (err) {
                setFileError(`Failed to parse file: ${err.message}`);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleProceed = () => {
        if (!uploadedResults && (!projectInputs || !projectInputs.bridge_data?.bridge_name)) {
            setFileError("Please enter project data or upload a .3psLCCA archive first.");
            return;
        }

        addLog("Running LCCA calculation engine...");
        
        // Ensure data is fresh
        const results = uploadedResults || runLccaCalculation(projectInputs);
        const summaries = computeAllSummaries(results);
        setComputedData(summaries);

        setTimeout(() => {
            setView('results');
            addLog("Calculation completed successfully.");
        }, 800);
    };

    const handleDownloadReport = () => {
        if (!computedData) {
            addLog("Error: Calculation results are not ready yet. Please click 'Proceed' or wait for data to load.");
            return;
        }
        setShowReportModal(true);
    };

    const handleConfirmReport = async (selections) => {
        setShowReportModal(false);
        if (isGeneratingPdf) return;
        
        setIsGeneratingPdf(true);
        addLog("Preparing professional LCCA report...");
        try {
            const charts = [pieChartRef, barChartRef];
            // Use resultsToUse which correctly handles both uploaded and live calculated results
            const resultsForReport = resultsToUse;
            
            await generateFullReport(
                projectInputs, 
                resultsForReport, 
                computedData, 
                addLog, 
                charts, 
                uploadedFileName,
                selections
            );
        } catch (err) {
            console.error("PDF Export Error:", err);
            addLog(`Error: ${err.message}`);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const renderValidation = () => (
        <div className="p-4" style={{ color: 'var(--app-text-primary)', position: 'relative' }}>
            <h2 className="mb-4" style={{ color: 'var(--app-primary-accent)' }}>Outputs</h2>
            
            <Form.Group className="mb-4">
                <Form.Label className="fw-bold" style={{ color: 'var(--app-text-primary)' }}>Project Results Data (.3psLCCAFile) *</Form.Label>
                <div className="mb-2" style={{ fontSize: '0.85rem', color: 'var(--app-text-secondary)' }}>Upload a previously calculated project file to view its outputs.</div>
                <div className="d-flex gap-3 align-items-center">
                    <Button 
                        variant="outline-secondary" 
                        onClick={() => fileInputRef.current.click()}
                        disabled={isLocked}
                        style={{ borderColor: 'var(--app-border-mid)', color: 'var(--app-text-primary)' }}
                    >
                        <FaFileUpload className="me-2" /> {uploadedResults ? "Change File" : "Choose File"}
                    </Button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="d-none"
                        accept=".3psLCCA,.3psLCCAFile,.json"
                        onChange={handleFileUpload}
                    />
                    {uploadedResults && <span style={{ fontSize: '0.9rem', color: 'var(--app-primary-accent)' }}><FaCheckCircle className="me-1" /> File loaded</span>}
                </div>
                {fileError && <div className="mt-2 text-danger" style={{ fontSize: '0.85rem' }}>{fileError}</div>}
            </Form.Group>

            <Form.Group className="mb-4">
                <Form.Label className="fw-bold" style={{ color: 'var(--app-text-primary)' }}>Analysis Period</Form.Label>
                <div className="mb-2" style={{ fontSize: '0.85rem', color: 'var(--app-text-secondary)' }}>Total time horizon used for life cycle cost evaluation.</div>
                <Form.Control 
                    type="text" 
                    disabled={true}
                    value={`${analysisPeriod} (years)`}
                    style={{ backgroundColor: 'var(--app-input-bg)', border: '1px solid var(--app-input-border)', color: 'var(--app-input-text)', opacity: 0.6 }}
                />
            </Form.Group>

            <Button 
                className="w-100 mt-4 py-2" 
                disabled={isLocked || (!uploadedResults && !projectInputs?.bridge_data?.bridge_name)}
                style={{ 
                    backgroundColor: 'var(--app-primary-accent)', 
                    border: 'none', 
                    color: '#000', 
                    fontWeight: 'bold', 
                    opacity: (isLocked || (!uploadedResults && !projectInputs?.bridge_data?.bridge_name)) ? 0.5 : 1 
                }}
                onClick={handleProceed}
            >
                Proceed with Calculation ▸
            </Button>
        </div>
    );

    const renderResults = () => {
        if (!computedData) return null;

        const { stagewise, pillar_totals } = computedData;
        const totalLcc = Object.values(stagewise).reduce((a, b) => a + b, 0);
        const initialCost = stagewise.initial;
        const futureCost = stagewise.use_reconstruction + (stagewise.end_of_life || 0);

        const formatValue = (val) => new Intl.NumberFormat('en-IN').format(Math.round(val));

        const summaryCards = [
            { title: "TOTAL LIFE CYCLE COST (YEAR)", value: formatValue(totalLcc), subtitle: "INR", desc: "A Comprehensive Analysis of Total Life-Cycle Expenditures evaluated at the assessment year." },
            { title: "INITIAL COST", value: formatValue(initialCost), subtitle: "INR", desc: "Cumulative total of construction, economic, social, and environmental costs incurred during the initial phase." },
            { title: "FUTURE COST", value: formatValue(futureCost), subtitle: "INR", desc: "Cumulative cost expected for maintenance, repairs, replacement and demolition." }
        ];

        const pieData = [
            { name: 'Economic', value: pillar_totals.eco, color: PILLAR_COLORS.economic },
            { name: 'Environmental', value: pillar_totals.env, color: PILLAR_COLORS.environmental },
            { name: 'Social', value: pillar_totals.social, color: PILLAR_COLORS.social }
        ];

        const barData = [
            { name: 'Initial', value: stagewise.initial, color: STAGE_COLORS.initial_stage },
            { name: 'Use & Recon', value: stagewise.use_reconstruction, color: STAGE_COLORS.use_stage },
            { name: 'End-of-Life', value: stagewise.end_of_life || 0, color: STAGE_COLORS.end_of_life }
        ];

        return (
            <div ref={reportRef} ref-id="report-container" className="p-4" style={{ color: 'var(--app-text-primary)', position: 'relative', backgroundColor: 'var(--app-bg-main)' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 style={{ color: 'var(--app-primary-accent)' }}>Outputs</h2>
                    <Button 
                        variant="outline-primary" 
                        onClick={handleDownloadReport} 
                        disabled={isLocked || isGeneratingPdf}
                        style={{ borderColor: 'var(--app-primary-accent)', color: 'var(--app-primary-accent)', opacity: (isLocked || isGeneratingPdf) ? 0.5 : 1 }}
                    >
                        {isGeneratingPdf ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Generating...</>
                        ) : (
                            <><FaFileDownload className="me-2" /> Download Report</>
                        )}
                    </Button>
                </div>

                <h4 className="mb-4" style={{ color: 'var(--app-text-primary)' }}>At a Glance</h4>
                <Row className="mb-5">
                    {summaryCards.map((card, idx) => (
                        <Col key={idx} md={4}>
                            <Card style={{ backgroundColor: 'var(--app-bg-card)', border: '1px solid var(--app-border-light)', height: '100%' }}>
                                <Card.Body>
                                    <div className="text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '1px' }}>{card.title}</div>
                                    <div className="d-flex align-items-baseline gap-2 mb-2">
                                        <span style={{ fontSize: '0.75rem', color: 'var(--app-text-muted)' }}>{card.subtitle}</span>
                                        <h3 className="mb-0" style={{ color: 'var(--app-primary-accent)', fontWeight: '700' }}>{card.value}</h3>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--app-text-secondary)', lineHeight: '1.5' }}>{card.desc}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <h4 className="mb-3" style={{ color: 'var(--app-text-primary)' }}>Life cycle cost distribution</h4>
                <p className="mb-4" style={{ fontSize: '0.9rem', color: 'var(--app-text-secondary)', lineHeight: '1.6' }}>
                    These charts illustrate the distribution of project costs. The Sustainability Matrix disaggregates costs across the Economic, Environmental, and Social Pillars. 
                    The aggregation chart compares the relative weight of three lifecycle phases: Initial Construction, the combined Use/Maintenance/Reconstruction stage, and the final End-of-Life phase.
                </p>

                <Row className="mb-5">
                    <Col md={6}>
                        <Card style={{ backgroundColor: 'var(--app-bg-card)', border: '1px solid var(--app-border-light)', padding: '20px' }}>
                            <h5 className="text-center mb-4" style={{ color: 'var(--app-text-primary)' }}>Sustainability Matrix</h5>
                            <div ref={pieChartRef} style={{ height: '300px' }}>
                                <D3PieChart data={pieData} />
                            </div>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card style={{ backgroundColor: 'var(--app-bg-card)', border: '1px solid var(--app-border-light)', padding: '20px' }}>
                            <h5 className="text-center mb-4" style={{ color: 'var(--app-text-primary)' }}>Lifecycle Disaggregation</h5>
                            <div ref={barChartRef} style={{ height: '300px' }}>
                                <D3BarChart data={barData} />
                            </div>
                        </Card>
                    </Col>
                </Row>

                <h4 className="mb-3" style={{ color: 'var(--app-text-primary)' }}>Consolidated stage summary</h4>
                <p className="mb-4" style={{ fontSize: '0.9rem', color: 'var(--app-text-secondary)', lineHeight: '1.6' }}>
                    A consolidated presentation of costs across the three pillars (economic, social, and environmental) for each lifecycle stage.
                    This table facilitates the identification of phases that bear the most substantial burden.
                </p>
                
                <Table responsive className="custom-output-table mb-5" style={{ color: 'var(--app-text-primary)', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                    <thead>
                        <tr style={{ color: 'var(--app-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                            <th style={{ border: 'none' }}>Stage</th>
                            <th style={{ border: 'none' }}>Economic (M INR)</th>
                            <th style={{ border: 'none' }}>Environmental (M INR)</th>
                            <th style={{ border: 'none' }}>Social (M INR)</th>
                            <th style={{ border: 'none' }}>Stage Total (M INR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {STAGE_DEFS.map(([label, key, pillars]) => {
                            const totals = computeStagePillarTotals(resultsToUse, key, pillars);
                            if (!totals) return null;
                            const stageTotal = Object.values(totals).reduce((a, b) => a + b, 0);
                            return (
                                <tr key={key} style={{ backgroundColor: 'var(--app-bg-card)', fontSize: '0.9rem' }}>
                                    <td style={{ padding: '15px', border: 'none', fontWeight: '500' }}>{label}</td>
                                    <td style={{ padding: '15px', border: 'none', color: 'var(--app-text-primary)' }}>{(totals.economic / 1e6).toFixed(2)}</td>
                                    <td style={{ padding: '15px', border: 'none', color: 'var(--app-text-primary)' }}>{(totals.environmental / 1e6).toFixed(2)}</td>
                                    <td style={{ padding: '15px', border: 'none', color: 'var(--app-text-primary)' }}>{(totals.social / 1e6).toFixed(2)}</td>
                                    <td className="fw-bold" style={{ padding: '15px', border: 'none' }}>{(stageTotal / 1e6).toFixed(2)}</td>
                                </tr>
                            );
                        })}
                        <tr style={{ backgroundColor: 'var(--app-bg-card)', fontSize: '0.9rem', borderTop: '2px solid var(--app-border-mid)' }}>
                            <td className="fw-bold" style={{ padding: '15px', border: 'none' }}>Grand Total</td>
                            <td className="fw-bold" style={{ padding: '15px', border: 'none' }}>{(pillar_totals.eco / 1e6).toFixed(2)}</td>
                            <td className="fw-bold" style={{ padding: '15px', border: 'none' }}>{(pillar_totals.env / 1e6).toFixed(2)}</td>
                            <td className="fw-bold" style={{ padding: '15px', border: 'none' }}>{(pillar_totals.social / 1e6).toFixed(2)}</td>
                            <td className="fw-bold" style={{ padding: '15px', border: 'none' }}>{(totalLcc / 1e6).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </Table>

                <h4 className="mb-4" style={{ color: 'var(--app-text-primary)' }}>Itemized detail</h4>
                <Card style={{ backgroundColor: 'var(--app-bg-card)', border: '1px solid var(--app-border-light)' }}>
                    <Card.Body>
                        <Table responsive className="mb-0" style={{ color: 'var(--app-text-primary)' }}>
                            <thead>
                                <tr style={{ fontSize: '0.8rem', color: 'var(--app-text-muted)' }}>
                                    <th>Stage</th>
                                    <th>Cost Item</th>
                                    <th className="text-end">Value (M INR)</th>
                                    <th style={{ width: '40%' }}>Relative Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {BREAKDOWN_STAGES.map((stage) => {
                                    const stageData = resultsToUse[stage.resultKey];
                                    if (!stageData) return null;
                                    
                                    return stage.rows.map((row, rowIdx) => {
                                        const val = stageData[row.pillar]?.[row.key] || 0;
                                        if (val === 0) return null;
                                        
                                        const pct = (val / totalLcc) * 100;
                                        
                                        return (
                                            <tr key={`${stage.resultKey}-${row.key}`}>
                                                {rowIdx === 0 && (
                                                    <td rowSpan={stage.rows.length} style={{ verticalAlign: 'middle', borderRight: '1px solid var(--app-border-light)', fontSize: '0.75rem', writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'var(--app-text-muted)', backgroundColor: 'var(--app-bg-main)' }}>
                                                        {stage.label}
                                                    </td>
                                                )}
                                                <td style={{ padding: '15px' }}>{row.label}</td>
                                                <td className="text-end fw-bold" style={{ padding: '15px' }}>{(val / 1e6).toFixed(2)}</td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ height: '10px', width: `${Math.min(100, pct * 2)}%`, backgroundColor: PILLAR_COLORS[row.pillar], borderRadius: '2px' }}></div>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>

                <Button 
                    variant="outline-secondary" 
                    className="mt-4" 
                    disabled={isLocked}
                    style={{ color: 'var(--app-text-secondary)', borderColor: 'var(--app-border-mid)' }}
                    onClick={() => setView('validation')}
                >
                    ← Back to Validation
                </Button>
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100%', backgroundColor: 'var(--app-bg-main)', position: 'relative' }}>
            <style>{`
                .custom-output-table td { border-bottom: 1px solid var(--app-border-light) !important; }
                .lock-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0,0,0,0.05);
                    z-index: 10;
                    cursor: not-allowed;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    padding-top: 100px;
                }
            `}</style>
            {isLocked && (
                <div className="lock-overlay">
                    <div className="d-flex align-items-center" style={{ 
                        backgroundColor: 'var(--app-bg-card)', 
                        border: '2px solid var(--app-primary-accent)', 
                        color: 'var(--app-primary-accent)', 
                        padding: '12px 24px', 
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        gap: '10px'
                    }}>
                        <FaExclamationTriangle /> PROJECT LOCKED - READ ONLY MODE
                    </div>
                </div>
            )}
            {view === 'validation' ? renderValidation() : renderResults()}
            
            <ReportSectionModal 
                show={showReportModal} 
                onHide={() => setShowReportModal(false)} 
                onConfirm={handleConfirmReport} 
            />
        </div>
    );
};

export default Outputs;
