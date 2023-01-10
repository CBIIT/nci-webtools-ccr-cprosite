import { useRecoilValue } from "recoil";
import { Row, Col, Form, ToggleButton, ToggleButtonGroup, OverlayTrigger, Tooltip, Tabs, Tab } from "react-bootstrap";
import { useState } from "react";
import { formState, resultsState } from "./explore.state";
import Plot from "react-plotly.js";

import TypeDropdownCorrelation from "../components/protain-correlation-dropdown"
import Table from "../components/table";
import { ExcelFile, ExcelSheet } from "../components/excel-export";

export default function MRNACorrelation() {
    const form = useRecoilValue(formState);
    const results = useRecoilValue(resultsState);
    const firstGene = form.gene.label;
    const secondGene = form.correlatedGene.label;
    const [view, setView] = useState(form.cancer.map((e) => e.value))
    const [rnaType, setRNAType] = useState("cptac")
    const [label, setLabel] = useState(form.cancer[0].label);
    const [tab, setTab] = useState("summaryView");

    const currentTumor = view.length > 1 ? form.cancer.map((e) => e.value) : form.cancer.find((e) => e.value === view[0]) ? view : form.cancer.map((e) => e.value);
    const currentLabel = currentTumor.length > 1 ? "" : form.cancer.find((e) => e.value === view[0]) ? label : form.cancer[0].label;

    var firstGeneSet = rnaType === "cptac" ? results[0].rna.records.filter((e) => currentTumor.includes(e.cancerId)) : results[0].tcga.records.filter((e) => currentTumor.includes(e.cancerId));
    var secondGeneSet = rnaType === "cptac" ? results[1].rna.records.filter((e) => currentTumor.includes(e.cancerId)) : results[1].tcga.records.filter((e) => currentTumor.includes(e.cancerId));

    const participantData = firstGeneSet.map((first) => {
        const second = secondGeneSet.find((e) => {
            return first.participantId === e.participantId
        })

        if (second) {
            return {
                name: first.participantId,
                firstTumor: first.tumorValue !== null ? Number(first.tumorValue.toFixed(4)) : "NA",
                firstControl: first.normalValue !== null ? Number(first.normalValue.toFixed(4)) : "NA",
                secondTumor: second.tumorValue !== null ? Number(second.tumorValue.toFixed(4)) : "NA",
                secondControl: second.normalValue !== null ? Number(second.normalValue.toFixed(4)) : "NA",
            };
        }
    })


    const correlatedParticipants = participantData.filter(
        (e) => e.firstTumor !== "NA" && e.firstControl !== "NA" && e.secondTumor !== "NA" && e.secondControl !== "NA",
    );

    const geneScatter = [
        //console.log(numType,proteinGeneCorrelation),
        {
            x: correlatedParticipants.map((e) => e.firstTumor),
            y: correlatedParticipants.map((e) => e.secondTumor),
            marker: {
                size: 8,
                color: "rgb(255,0,0)",
            },
            mode: "markers",
            type: "scatter",
            name: "Tumor",
            text: correlatedParticipants.map((e) => e.name),
            hovertemplate:
                `Patient ID: %{text}<br>${firstGene} Tumor Abundance: %{x}<br>` +
                `${secondGene} Tumor Abuncance: %{y})<extra></extra>`,
        },
        {
            x: correlatedParticipants.map((e) => e.firstControl),
            y: correlatedParticipants.map((e) => e.secondControl),
            marker: {
                size: 8,
                color: "rgb(31,119,180)",
            },
            mode: "markers",
            type: "scatter",
            name: "Adjacent Normal",
            text: correlatedParticipants.map((e) => e.name),
            hovertemplate:
                `Patient ID: %{text}<br>${firstGene} Control Abundance: %{x}<br>` +
                `${secondGene} Control Abundance: %{y}<extra></extra>`,
        },
    ];

    const correlationColumns = [
        {
            accessor: "name",
            id: "name",
            label: "Patient ID",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_correlation_patient">Patient ID</Tooltip>}>
                    <b>Patient ID</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "firstTumor",
            label: `${firstGene} Tumor`,
            Header: (
                <OverlayTrigger
                    overlay={
                        <Tooltip id="first_tumor">
                            {firstGene} Tumor
                        </Tooltip>
                    }>
                    <b>
                        {firstGene} Tumor
                    </b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "secondTumor",
            label: `${secondGene} Tumor`,
            Header: (
                <OverlayTrigger
                    overlay={
                        <Tooltip id="second_tumor">
                            {secondGene} Tumor
                        </Tooltip>
                    }>
                    <b>
                        {secondGene} Tumor
                    </b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "firstControl",
            label: `${firstGene} Adjacent Normal`,
            Header: (
                <OverlayTrigger
                    overlay={
                        <Tooltip id="first_control">
                            ${firstGene} Adjacent Normal
                        </Tooltip>
                    }>
                    <b>
                        {firstGene} Adj. Normal
                    </b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "secondControl",
            label: `${secondGene} Adjacent Normal`,
            Header: (
                <OverlayTrigger
                    overlay={
                        <Tooltip id="second_control">
                            {secondGene} Adjacent Normal
                        </Tooltip>
                    }>
                    <b>
                        {secondGene} Adj. Normal
                    </b>
                </OverlayTrigger>
            ),
        }
    ];

    function exportSummarySettings() {
        var settings = form.cancer
            .map((e) => {
                return [{ value: e.label }];
            });

        if (settings.length === 0) settings.push([{ value: form.cancer[0].label }]);

        settings[0].push({ value: form.dataset.label });
        settings[0].push({ value: "Correlation" });
        settings[0].push({ value: form.gene.label });
        settings[0].push({ value: form.correlatedGene.label });

        return [
            {
                columns: [
                    { title: "Tumor", width: { wpx: 160 } },
                    { title: "Dataset", width: { wpx: 160 } },
                    { title: "Analysis", width: { wpx: 160 } },
                    { title: "Gene", width: { wpx: 160 } },
                    { title: "Correlated Gene", width: { wpx: 160 } },
                ],
                data: settings,
            },
        ];
    }

    const exportSummary = [
        {
            columns: correlationColumns.map((e) => {
                return { title: e.label, width: { wpx: 200 } };
            }),
            data: participantData.filter(c => c.name).map((e) => {
                return [
                    { value: e.name },
                    { value: e.firstTumor },
                    { value: e.secondTumor },
                    { value: e.firstControl },
                    { value: e.secondControl },
                ];
            }),
        },
    ];

    const defaultLayout = {
        xaxis: {
            title: `<b>${firstGene}</b>`,
            zeroline: false,
            titlefont: {
                size: 16,
            },
        },
        yaxis: {
            title: `<b>${secondGene}</b>`,
            zeroline: false,
            titlefont: {
                size: 16,
            },
        },
        legend: {
            itemsizing: "constant",
            itemwidth: 40,
        },
        hovermode: "closest",
        hoverlabel: {
            bgcolor: "#FFF",
            font: { color: "#000", size: 15 },
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
            <Tab eventKey="summaryView" title="Summary">
                <Form.Group className="row m-3" controlId="mRNACorrelationView">
                    <div className="row col-xl-12 mb-3">
                        {form.cancer.length > 1 ? <Form.Label className="col-xl-1 col-xs-12 col-form-label" style={{ minWidth: "120px" }}>
                            Tumor Type
                        </Form.Label>
                            : ''}
                        {form.cancer.length > 1 ?
                            <TypeDropdownCorrelation form={form} view={view} setView={setView} setLabel={setLabel} controlid="tumorViewDropdown" />
                            : ''}

                        <ToggleButtonGroup
                            type="radio"
                            name="plot-tab"
                            value={rnaType}
                            className="col-xl-5"
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
                    </div>
                    <Row className="mx-3 mt-3">
                        <Col xl={12}>
                            <Plot
                                data={geneScatter}
                                layout={{
                                    ...defaultLayout,
                                    title: `<b>${rnaType === "cptac" ? "CPTAC" : "TCGA"} mRNA${currentLabel ? " " + currentLabel : ""} ${firstGene} and ${secondGene} Correlation</b><br>`,
                                    autosize: true,
                                    legend: {
                                        orientation: "h",
                                        y: -0.13,
                                        x: 0.38,
                                    },
                                    annotations: [
                                        {
                                            text: correlatedParticipants.length === 0 ? "No data available" : "",
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
                                        filename: `mRNA_Correlation-${currentLabel}-${form.gene.label}-${form.correlatedGene.label}`,
                                    },
                                }}
                                useResizeHandler
                                className="flex-fill w-100"
                                style={{ height: "800px" }}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <div className="m-3">
                            <div className="d-flex" style={{ justifyContent: "flex-end" }}>
                                <ExcelFile
                                    filename={`${currentLabel}_${rnaType === "cptac" ? "CPTAC" : "TCGA"}_mRNA Correlation-${form.gene.label}-${form.correlatedGene.label}`}
                                    element={<a href="javascript:void(0)">Export Data</a>}>

                                    <ExcelSheet dataSet={exportSummarySettings()} name="Input Configuration" />
                                    <ExcelSheet dataSet={exportSummary} name="Protein Abundance Data" />
                                </ExcelFile>
                            </div>

                            <Table
                                columns={correlationColumns}
                                defaultSort={[{ id: "name", asc: true }]}
                                data={participantData}
                            />
                        </div>
                    </Row>
                </Form.Group>
            </Tab>
        </Tabs>
    )
}