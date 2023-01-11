import { Tabs, Tab, Row, Col, Form, OverlayTrigger, ToggleButtonGroup, ToggleButton, Tooltip } from "react-bootstrap";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import Plot from "react-plotly.js";

import Table from "../components/table";
import { ExcelFile, ExcelSheet } from "../components/excel-export";
import TumorDropdown from "../components/type-dropdown"
import { formState, resultsState, rnaState } from "./explore.state";

export default function RNAResults() {
    const form = useRecoilValue(formState);
    const getResults = useRecoilValue(resultsState);
    const [tab, setTab] = useState("summary");
    const [plotTab, setPlot] = useState("tumorVsControl");
    const [rnaType, setRNAType] = useState("cptac")
    const [view, setView] = useState(form.cancer.length ? form.cancer[0].value : 0)

    const currentTumor = form.cancer.find((e) => e.value === view)
        ? view
        : form.cancer.length
            ? form.cancer[0].value
            : 0;

    const rna = getResults[0].rna.records;
    const rnaSummary = getResults[0].rnaSummary.records.map((e) => {
        return ({
            name: form.cancer.find((f) => f.value === e.cancerId).label,
            id: e.cancerId,
            link:
                <a
                    onClick={() => {
                        setView(e.cancerId);
                        setTab("tumorView");
                    }}
                    href="javascript:void(0)">
                    {form.cancer.find((f) => f.value === e.cancerId).label}
                </a>,
            tumorAverage: e.tumorSampleMean !== null ? Number(e.tumorSampleMean.toFixed(4)) : "NA",
            controlAverage: e.normalSampleMean !== null ? Number(e.normalSampleMean.toFixed(4)) : "NA",
            proteinDiff:
                e.normalSampleMean !== null && e.tumorSampleMean !== null
                    ? Number((e.tumorSampleMean - e.normalSampleMean).toFixed(4))
                    : "NA",
            tumorNum: e.tumorSampleCount !== null ? e.tumorSampleCount : "NA",
            controlNum: e.normalSampleCount !== null ? e.normalSampleCount : "NA",
            pValuePaired:
                e.pValuePaired !== null
                    ? Number(e.pValuePaired.toFixed(4)) < 0.0001
                        ? "< 0.0001"
                        : Number(e.pValuePaired.toFixed(4))
                    : "NA",
            pValueUnpaired:
                e.pValueUnpaired !== null
                    ? Number(e.pValueUnpaired.toFixed(4)) < 0.0001
                        ? "< 0.0001"
                        : Number(e.pValueUnpaired.toFixed(4))
                    : "NA",
            tumorError: e.tumorSampleStandardError !== null ? Number(e.tumorSampleStandardError.toFixed(4)) : "NA",
            controlError: e.normalSampleStandardError !== null ? Number(e.normalSampleStandardError.toFixed(4)) : "NA",
        })
    });
    const tcga = getResults[0].tcga.records;
    const tcgaSummary = getResults[0].tcgaSummary.records.map((e) => {
        return ({
            name: form.cancer.find((f) => f.value === e.cancerId).label,
            id: e.cancerId,
            link:
                <a
                    onClick={() => {
                        setView(e.cancerId);
                        setTab("tumorView");
                    }}
                    href="javascript:void(0)">
                    {form.cancer.find((f) => f.value === e.cancerId).label}
                </a>,
            tumorAverage: e.tumorSampleMean !== null ? Number(e.tumorSampleMean.toFixed(4)) : "NA",
            controlAverage: e.normalSampleMean !== null ? Number(e.normalSampleMean.toFixed(4)) : "NA",
            proteinDiff:
                e.normalSampleMean !== null && e.tumorSampleMean !== null
                    ? Number((e.tumorSampleMean - e.normalSampleMean).toFixed(4))
                    : "NA",
            tumorNum: e.tumorSampleCount !== null ? e.tumorSampleCount : "NA",
            controlNum: e.normalSampleCount !== null ? e.normalSampleCount : "NA",
            pValuePaired:
                e.pValuePaired !== null
                    ? Number(e.pValuePaired.toFixed(4)) < 0.0001
                        ? "< 0.0001"
                        : Number(e.pValuePaired.toFixed(4))
                    : "NA",
            pValueUnpaired:
                e.pValueUnpaired !== null
                    ? Number(e.pValueUnpaired.toFixed(4)) < 0.0001
                        ? "< 0.0001"
                        : Number(e.pValueUnpaired.toFixed(4))
                    : "NA",
            tumorError: e.tumorSampleStandardError !== null ? Number(e.tumorSampleStandardError.toFixed(4)) : "NA",
            controlError: e.normalSampleStandardError !== null ? Number(e.normalSampleStandardError.toFixed(4)) : "NA",
        })
    }); 
    function exportSummarySettings() {
        var settings = form.cancer.map((e) => {
            return [{ value: e.label }];
        });
        settings.forEach((s) => {
            s.push({ value: "Protein Abundance" })
            s.push({ value: "Tumor vs Control" })
            s.push({ value: form.gene.label })
        });
        return [
            {
                columns: [
                    { title: "Tumor", width: { wpx: 160 } },
                    { title: "Dataset", width: { wpx: 160 } },
                    { title: "Analysis", width: { wpx: 160 } },
                    { title: "Gene", width: { wpx: 160 } },
                ],
                data: settings,
            },
        ];
    }

    function handleToggle(e) {
        setPlot(e.target.control.id);
    }

    function exportSummary(summary) {
        return [
            {
                columns: summaryColumns.map((e) => {
                    return { title: e.label, width: { wpx: 160 } };
                }),
                data: summary.map((e) => {
                    return [
                        { value: e.name },
                        { value: e.tumorAverage },
                        { value: e.controlAverage },
                        { value: e.proteinDiff },
                        { value: e.tumorNum },
                        { value: e.controlNum },
                        { value: e.tumorError },
                        { value: e.controlError },
                        { value: e.pValuePaired },
                        { value: e.pValueUnpaired },
                    ];
                }),
            },
        ];
    }

    const proteinAbundanceColumns = [
        {
            accessor: "name",
            id: "name",
            label: "Patient ID",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_patient">Patient ID</Tooltip>}>
                    <b>Patient ID</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "tumorValue",
            label: "Tumor Abundance",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_tumor_val">Tumor Abundance</Tooltip>}>
                    <b>Tumor Abundance</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "normalValue",
            label: "Adjacent Normal Abundance",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_normal_val">Adjacent Normal Abundance</Tooltip>}>
                    <b>Adj. Normal Abundance</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "proteinDiff",
            label: "Log2 Fold Change",
            Header: (
                <OverlayTrigger
                    overlay={
                        <Tooltip id="protein_log_fold">
                            Average Protein Abundance Difference (log<sub>2</sub> ratio between Tumor vs Adjacent Normal)
                        </Tooltip>
                    }>
                    <b>
                        Log<sub>2</sub> Fold Change
                    </b>
                </OverlayTrigger>
            ),
        },
    ];

    const summaryColumns = [
        {
            accessor: "link",
            id: "link",
            label: "Tumor Type",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_tumor">Tumor Type</Tooltip>}>
                    <b>Tumor Type</b>
                </OverlayTrigger>
            ),
            sort: true,
        },
        {
            accessor: "tumorAverage",
            label: "Average Tumor",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_av_tumor">Average Tumor</Tooltip>}>
                    <b>Avg. Tumor</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "controlAverage",
            label: "Average Adjacent Normal",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_av_normal">Average Adjacent Normal</Tooltip>}>
                    <b>Avg. Adj. Normal</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "proteinDiff",
            label: "Tumor vs Adjacent Normal",
            Header: (
                <OverlayTrigger
                    overlay={
                        <Tooltip id="protein_diff">
                            Average Protein Abundance Difference (log<sub>2</sub> ratio between Tumor vs Adjacent Normal)
                        </Tooltip>
                    }>
                    <b>Tumor vs Adj. Normal</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "tumorNum",
            label: "Tumor Count",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_tumor_count">Tumor Sample Number</Tooltip>}>
                    <b>Tumor Count</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "controlNum",
            label: "Adjacent Normal Count",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_normal_count">Adjacent Normal Sample Number</Tooltip>}>
                    <b>Adj. Normal Count</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "tumorError",
            label: "Tumor SE",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_tumor_se">Tumor Standard Error</Tooltip>}>
                    <b>Tumor SE</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "controlError",
            label: "Adjacent Normal SE",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_control_se">Adjacent Normal Stanadard Error</Tooltip>}>
                    <b>Adj. Normal SE</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "pValuePaired",
            label: "P Value (Paired)",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_pvalue">Mann-Whitney U Test (Paired)</Tooltip>}>
                    <b>P Value (Paired)</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "pValueUnpaired",
            label: "P Value (Unpaired)",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_pvalue">Mann-Whitney U Test (Unpaired)</Tooltip>}>
                    <b>P Value (Unpaired)</b>
                </OverlayTrigger>
            ),
        },
    ];

    function xlabelmap(c) {
        var xlabel = c.name;
        if (xlabel.includes("Lung Adenocarcinoma")) xlabel = "Lung AD";
        else if (xlabel.includes("Lung Squamous Cell Carcinoma")) xlabel = "Lung SC";
        else if (xlabel.includes("Pancreatic Ductal Adenocarcinoma")) xlabel = "PDAC";
        else xlabel = xlabel.replace("Cancer", "")
        return xlabel;
    }

    function summaryData(records) {
        records = records.sort((a,b) => a.name.localeCompare(b.name))
        const hovertext = records.map((e) => xlabelmap(e))
        const hovertextdisplay = hovertext.map(ht => {
            ht = ht.replace("(", "<br>Tumor Count:");
            ht = ht.replace("-", "<br>Adj. Normal Count:");
            ht = ht.replace(")", "");
            return ht;
        })

        return ([
            {
                x: records.map((e) => xlabelmap(e)),
                y: records.map((e) => e.tumorAverage),
                marker: {
                    color: "rgb(255,0,0)",
                },
                error_y: {
                    type: "data",
                    array: records.map((e) => e.tumorError),
                    visible: true,
                    color: "rgb(255,0,0)",
                },
                type: "bar",
                name: "Tumor",
                hovertext: hovertextdisplay,
                hovertemplate: "%{hovertext}<br>Tumor vs Normal:%{y} <extra></extra>",
            },
            {
                x: records.map((e) => xlabelmap(e)),
                y: records.map((e) => e.controlAverage),
                error_y: {
                    type: "data",
                    array: records.map((e) => e.controlError),
                    visible: true,
                    color: "rgb(0,112,192)",
                },
                marker: {
                    color: "rgb(0,112,192)",
                },
                type: "bar",
                name: "Control",
                hovertext: hovertextdisplay,
                hovertemplate: "%{hovertext}<br>Tumor vs Normal:%{y} <extra></extra>",
            }
        ])
    }

    function boxPlotData(records) {

        return (
            [
                {
                    y: records.filter((e) => Number(e.cancerId) === currentTumor).map((e) => e.tumorValue),
                    type: "box",
                    boxpoints: "all",
                    name: "<b>Tumor</b>",
                    jitter: 0.6,
                    marker: {
                        size: 10,
                        color: "rgb(255,0,0)",
                    },
                    text: records.filter((e) => Number(e.cancerId) === currentTumor).map((e) => e.participantId),
                    hovertemplate: "Patient ID: %{text} <br>Tumor Abundance: %{y}<extra></extra>",
                },
                {
                    y: records.filter((e) => Number(e.cancerId) === currentTumor).map((e) => e.normalValue),
                    type: "box",
                    boxpoints: "all",
                    name: "<b>Adjacent Normal</b>",
                    jitter: 0.6,
                    marker: {
                        size: 10,
                        color: "rgb(31,119,180)",
                    },
                    text: records.filter((e) => Number(e.cancerId) === currentTumor).map((e) => e.participantId),
                    hovertemplate: "Patient ID: %{text}<br>Adj. Normal Abundance: %{y}<extra></extra>",
                },
            ]
        )
    }

    function foldData(records) {
        if (records.length !== 0) {
            var caseList = records
                .filter((e) => Number(e.cancerId) === currentTumor && e.tumorValue !== null && e.normalValue !== null)
                .sort((a, b) => {
                    const aFoldChange = a.tumorValue - a.normalValue;
                    const bFoldChange = b.tumorValue - b.normalValue;

                    return aFoldChange > bFoldChange ? 1 : -1;
                });

            const values = caseList.map((c) =>
                Number((Number(c.tumorValue.toFixed(4)) - Number(c.normalValue.toFixed(4))).toFixed(4)),
            );

            return [
                {
                    type: "bar",
                    x: values,
                    y: caseList.map((c) => c.participantId),
                    marker: {
                        color: values.map((c) => (c > 0 ? "rgb(255,0,0)" : "rgb(31,119,180)")),
                    },
                    orientation: "h",
                    hovertemplate: "Patient ID: %{y}<br>Log Fold Change: %{x}<extra></extra>",
                },
                {
                    type: "bar",
                    x: values,
                    y: caseList.map((c) => c.participantId),
                    marker: {
                        color: values.map((c) => (c > 0 ? "rgb(255,0,0)" : "rgb(31,119,180)")),
                    },
                    xaxis: "x2",
                    orientation: "h",
                    hovertemplate: "Patient ID: %{y}<br>Log Fold Change: %{x}<extra></extra>",
                },
            ];
        }
    }
    console.log(foldData(rna))
    const exportAbundanceSettings = [
        {
            columns: [
                { title: "Tumor", width: { wpx: 160 } },
                { title: "Dataset", width: { wpx: 160 } },
                { title: "Analysis", width: { wpx: 160 } },
                { title: "Gene", width: { wpx: 160 } },
            ],
            data: [
                [
                    {
                        value: form.cancer.find((e) => e.value === currentTumor)
                            ? form.cancer.find((e) => e.value === currentTumor).label
                            : "NA",
                    },
                    { value: "Protein Abundance" },
                    { value: "Tumor vs Control" },
                    { value: form.gene.label },
                ],
            ],
        },
    ];

    function exportAbundance(records) {
        return (
            [
                {
                    columns: proteinAbundanceColumns.map((e) => {
                        return { title: e.label, width: { wpx: 160 } };
                    }),
                    data:
                        records.filter((e) => Number(e) === currentTumor)
                            .map((c) => {
                                return [
                                    { value: c.participantId },
                                    {
                                        value: c.tumorValue ? Number(c.tumorValue.toFixed(4)) : "NA",
                                    },
                                    {
                                        value: c.normalValue ? Number(c.normalValue.toFixed(4)) : "NA",
                                    },
                                    {
                                        value:
                                            c.tumorValue && c.normalValue
                                                ? Number(Number(c.tumorValue.toFixed(4)) - Number(c.normalValue.toFixed(4)).toFixed(4))
                                                : "NA",
                                    },
                                ];
                            }),
                },
            ]
        )
    }

    const defaultLayout = {
        yaxis: {
            title: "<b>log2 Fold Change</b>",
            zeroline: false,
            titlefont: {
                size: 15,
            },
        },
        legend: {
            itemsizing: "constant",
            itemwidth: 40,
        },
        hovermode: "closest",
        hoverlabel: {
            bgcolor: "#FFF",
            font: { color: "#000", size: 16 },
            bordercolor: "#D3D3D3",
        },
    };

    const defaultConfig = {
        displayModeBar: true,
        toImageButtonOptions: {
            format: "svg",
            filename: "plot_export",
            height: 1000,
            width: 1000,
            scale: 1,
        },
        displaylogo: false,
        modeBarButtonsToRemove: ["select2d", "lasso2d", "hoverCompareCartesian", "hoverClosestCartesian"],
    };

    return (
        <Tabs activeKey={tab} onSelect={(e) => setTab(e)} className="mb-3">
            <Tab eventKey="summary" title="Summary">
                <ToggleButtonGroup
                    type="radio"
                    name="plot-tab"
                    value={rnaType}
                    className="mx-3 col-xl-6"
                    style={{ whiteSpace: "nowrap" }}>
                    <ToggleButton
                        className={rnaType === "cptac" ? "btn-primary" : "btn-secondary"}
                        id={"cptac"}
                        onClick={() => setRNAType("cptac")}>
                        CPTAC
                    </ToggleButton>
                    <ToggleButton
                        className={rnaType === "tcga" ? "btn-primary" : "btn-secondary"}
                        id={"tcga"}
                        onClick={() => setRNAType("tcga")}>
                        TCGA
                    </ToggleButton>
                </ToggleButtonGroup>
                <Row className="m-3">
                    <Col xl={12}>
                        <Plot
                            data={summaryData(rnaType === "cptac" ? rnaSummary : tcgaSummary)}
                            layout={{
                                ...defaultLayout,
                                bargap: 0.2,
                                bargroupgap: 0.1,
                                xaxis: {
                                    tickfont: {
                                        size: form.cancer.length > 1 ? 11 : 14,
                                        color: 'black',
                                    },
                                    tickangle:form.cancer.length > 1 ? 30 : 0,
                                    automargin: true,
                                },
                                yaxis: {
                                    title: rnaType === "cptac" ? "<b>HTSeq Counts</b>" : "<b>RNASeq Value</b>",
                                    zeroline: false,
                                    titlefont: {
                                        size: 15,
                                    },
                                },
                                title: `<b>${rnaType === "cptac" ? "CPTAC" : "TCGA"} ${form.gene.label} mRNA Level Tumor vs Control</b>`,
                                barmode: "group",
                                autosize: true,
                                legend: {
                                    orientation: "h",
                                    y: -0.22,
                                    x: 0.41,
                                    font: { size: 16 },
                                },
                                annotations: [
                                    {
                                        text: (rnaType === "cptac" && rna.length === 0) || (rnaType === "tcga" && tcga.length === 0) ? "No data available" : "",
                                        xref: "paper",
                                        yref: "paper",
                                        showarrow: false,
                                        font: {
                                            size: 28,
                                            color: "grey",
                                        },
                                    },
                                ],
                            }}
                            config={{
                                ...defaultConfig,
                                toImageButtonOptions: {
                                    ...defaultConfig.toImageButtonOptions,
                                    filename: `${rnaType === "cptac" ? "CPTAC" : "TCGA"}_RNA_Level_Tumor_vs_Adjacent_Normal-${form.gene.label}`,
                                },
                            }}
                            useResizeHandler
                            className="flex-fill w-100"
                            style={{ height: "500px" }}
                        />
                    </Col>
                </Row>


                <div className="m-3">
                    {<div className="d-flex" style={{ justifyContent: "flex-end" }}>
                        <ExcelFile
                            filename={`${rnaType === "cptac" ? "CPTAC" : "TCGA"}_RNA_Level_TCGA_Tumor_vs_Adjacent_Normal-${form.gene.label}`}
                            element={<a href="javascript:void(0)">Export Data</a>}>
                            <ExcelSheet dataSet={exportSummarySettings()} name="Input Configuration" />
                            <ExcelSheet dataSet={exportSummary(rnaType === "cptac" ? rnaSummary : tcgaSummary)} name="Summary Data" />
                        </ExcelFile>
                    </div>}

                    <Table columns={summaryColumns} data={rnaType === "cptac" ? rnaSummary : tcgaSummary}
                        defaultSort={[{ id: "link", desc: false }]} />
                </div>
            </Tab>
            <Tab eventKey="tumorView" title="Tumor View">
                <Form.Group className="row mx-3" controlId="tumorView">
                    <div className="row col-xl-12 mb-3">
                        {form.cancer.length > 1 ? <Form.Label className="col-xl-1 col-xs-12 col-form-label" style={{ minWidth: "120px" }}>
                            Tumor Type
                        </Form.Label>
                            : ''}
                        {form.cancer.length > 1 ?
                            <TumorDropdown form={form} view={view} setView={setView} controlid="tumorViewDropdown" />
                            : ''}
                    </div>
                    <ToggleButtonGroup
                        type="radio"
                        name="plot-tab"
                        value={rnaType}
                        className="col-xl-6"
                        style={{ whiteSpace: "nowrap" }}>
                        <ToggleButton
                            className={rnaType === "cptac" ? "btn-primary" : "btn-secondary"}
                            id={"cptac"}
                            onClick={() => setRNAType("cptac")}>
                            CPTAC
                        </ToggleButton>
                        <ToggleButton
                            className={rnaType === "tcga" ? "btn-primary" : "btn-secondary"}
                            id={"tcga"}
                            onClick={() => setRNAType("tcga")}>
                            TCGA
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        type="radio"
                        name="plot-tab"
                        value={plotTab}
                        className="col-xl-6"
                        style={{ whiteSpace: "nowrap" }}>
                        <ToggleButton
                            className={plotTab === "tumorVsControl" ? "btn-primary" : "btn-secondary"}
                            id={"tumorVsControl"}
                            onClick={handleToggle}>
                            Tumor vs Adj. Normal
                        </ToggleButton>
                        <ToggleButton
                            className={plotTab === "foldChange" ? "btn-primary" : "btn-secondary"}
                            id={"foldChange"}
                            onClick={handleToggle}>
                            Log<sub>2</sub> Fold Change
                        </ToggleButton>
                    </ToggleButtonGroup>
                    
                    {rnaType === "cptac" && <Row className="mx-3 mt-3">
                        {plotTab === "tumorVsControl" && (
                            <Col xl={12} style={{ height: "800px" }}>
                                <Plot
                                    data={boxPlotData(rna)}
                                    layout={{
                                        ...defaultLayout,
                                        title: `<b>${rnaType === "cptac" ? "CPTAC" : "TCGA"} ${form.gene.label} ${form.cancer.find((f) => f.value === currentTumor).label
                                        } mRNA Level </b><br>(Unpaired P-Value: ${rnaSummary.length && rnaSummary.find((e) => e.id === view)
                                                ? rnaSummary.find((e) => e.id === view).pValueUnpaired
                                                : "NA"
                                            })`,

                                        yaxis: {
                                            title: "<b>HTSeq Counts</b>",
                                            zeroline: false,
                                            titlefont: {
                                                size: 15,
                                            },
                                        },
                                        xaxis: {
                                            titlefont: {
                                                size: 16,
                                            },
                                            tickfont: {
                                                size: 15,
                                            },
                                        },
                                        boxgroupgap: 0.4,
                                        boxgap: 0.4,
                                        autosize: true,
                                        legend: {
                                            orientation: "h",
                                            y: -0.1,
                                            x: 0.42,
                                            font: { size: 15 },
                                        },
                                        annotations: [
                                            {
                                                text:
                                                    rna.filter((f) => Number(f.cancerId) === currentTumor).length === 0 ? "No data available" : "",
                                                xref: "paper",
                                                yref: "paper",
                                                showarrow: false,
                                                font: {
                                                    size: 28,
                                                    color: "grey",
                                                },
                                            },
                                        ],
                                    }}
                                    config={{
                                        ...defaultConfig,
                                        toImageButtonOptions: {
                                            ...defaultConfig.toImageButtonOptions,
                                            filename: `${form.cancer.find((f) => f.value === currentTumor).label
                                                }_Protein_Abundance_Tumor_vs_Adjacent_Normal-${form.gene.label}`,
                                        },
                                    }}
                                    useResizeHandler
                                    style={{ height: "800px" }}
                                />
                            </Col>
                        )}
                        {plotTab === "foldChange" && (
                            <Col xl={12} style={{ height: "800px", overflowY: "auto" }}>
                                <Plot
                                    data={foldData(rna)}
                                    config={{
                                        ...defaultConfig,
                                        toImageButtonOptions: {
                                            ...defaultConfig.toImageButtonOptions,
                                            filename: `${form.cancer.find((f) => f.value === currentTumor).label
                                                }_Protein_Abundance_Tumor_vs_Adjacent_Normal_Log_Fold_Change-${form.gene.label}`,
                                        },
                                    }}
                                    layout={{
                                        autosize: true,
                                        title: `<b>${rnaType === "cptac" ? "CPTAC" : "TCGA"} ${form.gene.label} ${form.cancer.find((f) => f.value === currentTumor).label
                                        } Log<sub>2</sub> Fold Change</b><br>(Paired P-Value: ${rnaSummary.length && rnaSummary.find((e) => e.id === view)
                                                ? rnaSummary.find((e) => e.id === view).pValuePaired
                                                : "NA"
                                            })`,
                                        xaxis: {
                                            title: "<b>Log<sub>2</sub> Fold Change</b>",
                                            zeroline: false,
                                            titlefont: {
                                                size: 16,
                                            },
                                        },
                                        xaxis2: {
                                            zeroline: false,
                                            overlaying: "x",
                                            side: "top",
                                        },
                                        yaxis: {
                                            tickfont: {
                                                size: 14,
                                            },
                                            automargin: true,
                                            type: "category",
                                        },
                                        showlegend: false,
                                        barmode: "stack",
                                        hoverlabel: {
                                            bgcolor: "#FFF",
                                            font: { color: "#000", size: 16 },
                                            bordercolor: "#D3D3D3",
                                            nameLength: 0,
                                        },
                                        annotations: [
                                            {
                                                text:
                                                    foldData(rna)[0].x.length === 0
                                                        ? "No data available"
                                                        : "",
                                                xref: "paper",
                                                yref: "paper",
                                                showarrow: false,
                                                font: {
                                                    size: 28,
                                                    color: "grey",
                                                },
                                            },
                                        ],
                                    }}
                                    useResizeHandler
                                    style={{
                                        minWidth: "100%",
                                        height: foldData(rna).length ? `${foldData(rna)[0].x.length * 25}px` : "700px",
                                        minHeight: "700px",
                                    }}
                                />
                            </Col>
                          
                        )}
                    </Row>}
                    {rnaType === "cptac" && <Row>
                        <div className="m-3">
                            <div className="d-flex" style={{ justifyContent: "flex-end" }}>
                                <ExcelFile
                                    filename={`${form.cancer.find((f) => f.value === currentTumor).label
                                        }_Protein_Abundance_Tumor_vs_Adjacent_Normal-${form.gene.label}`}
                                    element={<a href="javascript:void(0)">Export Data</a>}>

                                    <ExcelSheet dataSet={exportAbundanceSettings} name="Input Configuration" />
                                    <ExcelSheet dataSet={exportAbundance(rna)} name="Protein Abundance Data" />
                                </ExcelFile>
                            </div>

                            <Table
                                columns={proteinAbundanceColumns}
                                defaultSort={[{ id: "name", asc: true }]}
                                data={
                                    rna.filter((e) => Number(e.cancerId) === currentTumor)
                                        .map((c) => {
                                            return {
                                                name: c.participantId,
                                                tumorValue: c.tumorValue !== null ? Number(c.tumorValue.toFixed(4)) : "NA",
                                                normalValue: c.normalValue !== null ? Number(c.normalValue.toFixed(4)) : "NA",
                                                proteinDiff:
                                                    c.tumorValue !== null && c.normalValue !== null
                                                        ? Number((Number(c.tumorValue.toFixed(4)) - Number(c.normalValue.toFixed(4))).toFixed(4))
                                                        : "NA",
                                            };
                                        })
                                }
                            />
                        </div>
                    </Row>}
                    {console.log(rnaSummary)}
                    {console.log(tcgaSummary)}
                    {rnaType === "tcga" && <Row className="mx-3 mt-3">
                        {plotTab === "tumorVsControl" && (
                            <Col xl={12} style={{ height: "800px" }}>
                                <Plot
                                    data={boxPlotData(tcga)}
                                    layout={{
                                        ...defaultLayout,
                                        title: `<b>${rnaType === "cptac" ? "CPTAC" : "TCGA"} ${form.gene.label} ${form.cancer.find((f) => f.value === currentTumor).label
                                        } mRNA Level</b><br>(Unpaired P-Value: ${tcgaSummary.length && tcgaSummary.find((e) => e.id === view)
                                                ? tcgaSummary.find((e) => e.id === view).pValueUnpaired
                                                : "NA"
                                            })`,

                                        yaxis: {
                                            title: "<b>RNASeq Value</b>",
                                            zeroline: false,
                                            titlefont: {
                                                size: 15,
                                            },
                                        },
                                        xaxis: {
                                            titlefont: {
                                                size: 16,
                                            },
                                            tickfont: {
                                                size: 15,
                                            },
                                        },
                                        boxgroupgap: 0.4,
                                        boxgap: 0.4,
                                        autosize: true,
                                        legend: {
                                            orientation: "h",
                                            y: -0.1,
                                            x: 0.42,
                                            font: { size: 15 },
                                        },
                                        annotations: [
                                            {
                                                text:
                                                    tcga.filter((f) => Number(f.cancerId) === currentTumor).length === 0 ? "No data available" : "",
                                                xref: "paper",
                                                yref: "paper",
                                                showarrow: false,
                                                font: {
                                                    size: 28,
                                                    color: "grey",
                                                },
                                            },
                                        ],
                                    }}
                                    config={{
                                        ...defaultConfig,
                                        toImageButtonOptions: {
                                            ...defaultConfig.toImageButtonOptions,
                                            filename: `${form.cancer.find((f) => f.value === currentTumor).label
                                                }_Protein_Abundance_Tumor_vs_Adjacent_Normal-${form.gene.label}`,
                                        },
                                    }}
                                    useResizeHandler
                                    style={{ height: "800px" }}
                                />
                            </Col>
                        )}
                        {plotTab === "foldChange" && (
                            <Col xl={12} style={{ height: "800px", overflowY: "auto" }}>
                                <Plot
                                    data={foldData(tcga)}
                                    config={{
                                        ...defaultConfig,
                                        toImageButtonOptions: {
                                            ...defaultConfig.toImageButtonOptions,
                                            filename: `${form.cancer.find((f) => f.value === currentTumor).label
                                                }_Protein_Abundance_Tumor_vs_Adjacent_Normal_Log_Fold_Change-${form.gene.label}`,
                                        },
                                    }}
                                    layout={{
                                        autosize: true,
                                        title: `<b>${rnaType === "cptac" ? "CPTAC" : "TCGA"} ${form.gene.label} ${form.cancer.find((f) => f.value === currentTumor).label
                                        } Log<sub>2</sub> Fold Change</b><br>(Paired P-Value: ${tcgaSummary.length && tcgaSummary.find((e) => e.id === view)
                                                ? tcgaSummary.find((e) => e.id === view).pValuePaired
                                                : "NA"
                                            })`,
                                        xaxis: {
                                            title: "<b>Log<sub>2</sub> Fold Change</b>",
                                            zeroline: false,
                                            titlefont: {
                                                size: 16,
                                            },
                                        },
                                        xaxis2: {
                                            zeroline: false,
                                            overlaying: "x",
                                            side: "top",
                                        },
                                        yaxis: {
                                            tickfont: {
                                                size: 14,
                                            },
                                            automargin: true,
                                            type: "category",
                                        },
                                        showlegend: false,
                                        barmode: "stack",
                                        hoverlabel: {
                                            bgcolor: "#FFF",
                                            font: { color: "#000", size: 16 },
                                            bordercolor: "#D3D3D3",
                                            nameLength: 0,
                                        },
                                        annotations: [
                                            {
                                                text:
                                                foldData(tcga)[0].x.length === 0
                                                        ? "No data available"
                                                        : "",
                                                xref: "paper",
                                                yref: "paper",
                                                showarrow: false,
                                                font: {
                                                    size: 28,
                                                    color: "grey",
                                                },
                                            },
                                        ],
                                    }}
                                    useResizeHandler
                                    style={{
                                        minWidth: "100%",
                                        height: foldData(tcga).length ? `${foldData(tcga)[0].x.length * 25}px` : "700px",
                                        minHeight: "700px",
                                    }}
                                />
                            </Col>
                        )}
                    </Row>}

                    {rnaType === "tcga" && <Row>
                        <div className="m-3">
                            <div className="d-flex" style={{ justifyContent: "flex-end" }}>
                                <ExcelFile
                                    filename={`${form.cancer.find((f) => f.value === currentTumor).label
                                        }_Protein_Abundance_Tumor_vs_Adjacent_Normal-${form.gene.label}`}
                                    element={<a href="javascript:void(0)">Export Data</a>}>

                                    <ExcelSheet dataSet={exportAbundanceSettings} name="Input Configuration" />
                                    <ExcelSheet dataSet={exportAbundance(tcga)} name="Protein Abundance Data" />
                                </ExcelFile>
                            </div>

                            <Table
                                columns={proteinAbundanceColumns}
                                defaultSort={[{ id: "name", asc: true }]}
                                data={
                                    tcga.filter((e) => Number(e.cancerId) === currentTumor)
                                        .map((c) => {
                                            return {
                                                name: c.participantId,
                                                tumorValue: c.tumorValue !== null ? Number(c.tumorValue.toFixed(4)) : "NA",
                                                normalValue: c.normalValue !== null ? Number(c.normalValue.toFixed(4)) : "NA",
                                                proteinDiff:
                                                    c.tumorValue !== null && c.normalValue !== null
                                                        ? Number((Number(c.tumorValue.toFixed(4)) - Number(c.normalValue.toFixed(4))).toFixed(4))
                                                        : "NA",
                                            };
                                        })
                                }
                            />
                        </div>
                    </Row>}
                </Form.Group>
            </Tab>
        </Tabs>
    )
}