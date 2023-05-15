import { useRecoilValue } from "recoil";
import { Row, Col, Form, ToggleButton, ToggleButtonGroup, OverlayTrigger, Tooltip, Tabs, Tab } from "react-bootstrap";
import { useState } from "react";
import { formState, resultsState } from "./explore.state";
import Plot from "react-plotly.js";

import TypeDropdownCorrelation from "../components/protain-correlation-dropdown"
import Table from "../components/table";
import { ExcelFile, ExcelSheet } from "../components/excel-export";
import calculateCorrelation from "calculate-correlation";

export default function MRNACorrelation() {
    const form = useRecoilValue(formState);
    const results = useRecoilValue(resultsState);
    const firstGene = form.gene.label;
    const secondGene = form.correlatedGene.label;
    const [view, setView] = useState(form.cancer.map((e) => e.value))
    const [rnaType, setRNAType] = useState("cptac")
    const [label, setLabel] = useState(form.cancer[0].label);
    const [tab, setTab] = useState("summaryView");
    const [numType, setNumType] = useState("log2");
    const currentTumor = view.length > 1 ? form.cancer.map((e) => e.value) : form.cancer.find((e) => e.value === view[0]) ? view : form.cancer.map((e) => e.value);
    const currentLabel = currentTumor.length > 1 ? "" : form.cancer.find((e) => e.value === view[0]) ? label : form.cancer[0].label;
    var firstGeneSet = rnaType === "cptac" ? results[0].rna.records.filter((e) => currentTumor.includes(e.cancerId)) : results[0].tcga.records.filter((e) => currentTumor.includes(e.cancerId));
    var secondGeneSet = rnaType === "cptac" ? results[1].rna.records.filter((e) => currentTumor.includes(e.cancerId)) : results[1].tcga.records.filter((e) => currentTumor.includes(e.cancerId));
    const participantDataall = firstGeneSet.map((first) => {
        const second = secondGeneSet.find((e) => {
            return first.participantId === e.participantId
        })
        const cancerLabel = form.cancer.find(e => e.value==first.cancerId)
        if (second != undefined) {
            return {
                cancer: cancerLabel? cancerLabel.label:"",
                name: first.participantId,
                firstTumor: first.tumorValue !== null ? Number(Math.log2(first.tumorValue).toFixed(4)) : "NA",
                firstTumorNum: first.tumorValue !== null ? Number(first.tumorValue.toFixed(4)) : "NA",
                firstControl: first.normalValue !== null ? Number(Math.log2(first.normalValue).toFixed(4)) : "NA",
                firstControlNum: first.normalValue !== null ? Number(first.normalValue.toFixed(4)) : "NA",
                secondTumor: second.tumorValue !== null ? Number(Math.log2(second.tumorValue).toFixed(4)) : "NA",
                secondTumorNum: second.tumorValue !== null ? Number(second.tumorValue.toFixed(4)) : "NA",
                secondControl: second.normalValue !== null ? Number(Math.log2(second.normalValue).toFixed(4)) : "NA",
                secondControlNum: second.normalValue !== null ? Number(second.normalValue.toFixed(4)) : "NA",
            };
        }
    })
    console.log("form ", form);
    //filter undefined data
    const participantData = participantDataall.filter(e => e!==undefined)
    const correlatedParticipants = participantData.filter(
        (e) => e !== undefined && e.firstTumor !== "NA" && Number.isFinite(e.firstTumor) && e.firstControl !== "NA" && Number.isFinite(e.firstControl) && e.secondTumor !== "NA" && Number.isFinite(e.secondTumor) && e.secondControl !== "NA" && Number.isFinite(e.secondControl)
    );

    //filter out first tumors and second tumors that is NA
    const correlatedParticipantsTumor = participantData.filter(
        (e) => e !== undefined && e.firstTumor !== "NA" && Number.isFinite(e.firstTumor) && e.secondTumor !== "NA" && Number.isFinite(e.secondTumor) 
    );

    // filter out first control and second control that is NA
    const correlatedParticipantsControl = participantData.filter(
        (e) => e !== undefined  && e.firstControl !== "NA" && Number.isFinite(e.firstControl)  && e.secondControl !== "NA" && Number.isFinite(e.secondControl)
    );
   
    const geneScatter = [
        
        {
            x: correlatedParticipantsTumor.map((e) => numType === "log2" ? e.firstTumor : e.firstTumorNum),
            y: correlatedParticipantsTumor.map((e) => numType === "log2" ? e.secondTumor : e.secondTumorNum),
            marker: {
                size: 8,
                color: "rgb(255,0,0)",
            },
            customdata: correlatedParticipantsTumor.map((e) => e.cancer),
            mode: "markers",
            type: "scatter",
            name: "Tumor",
            text: correlatedParticipantsTumor.map((e) => e.name),
            hovertemplate:
                `Tumor Type: %{customdata}<br>`+
                `Patient ID: %{text}<br>${firstGene} Tumor Abundance: %{x}<br>` +
                `${secondGene} Tumor Abuncance: %{y}<extra></extra>`,
        },
        {
            x: correlatedParticipantsControl.map((e) => numType === "log2" ? e.firstControl : e.firstControlNum),
            y: correlatedParticipantsControl.map((e) => numType === "log2" ? e.secondControl : e.secondControlNum),
            marker: {
                size: 8,
                color: "rgb(31,119,180)",
            },
            mode: "markers",
            type: "scatter",
            name: currentTumor.includes(12) ? "Normal" : "Adjacent Normal",
            text: correlatedParticipantsControl.map((e) => e.name),
            customdata: correlatedParticipantsControl.map((e) => e.cancer),
            hovertemplate:
                `Tumor Type: %{customdata}<br>`+
                `Patient ID: %{text}<br>${firstGene} Control Abundance: %{x}<br>` +
                `${secondGene} Control Abundance: %{y}<extra></extra>`,
        },
    ];
    
    const correlationColumns = [
         {
            accessor: "cancer",
            id: "cancer",
            label: "cancer",
            Header: (
                <OverlayTrigger overlay={<Tooltip id="protein_correlation_tumor">Tumor Type</Tooltip>}>
                    <b>Tumor Type</b>
                </OverlayTrigger>
            ),
        },
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
            label: `${firstGene} Tumor Log2`,
            Header: (
                <OverlayTrigger
                    overlay={
                        <Tooltip id="first_tumor">
                            {firstGene} Tumor Log<sub>2</sub>
                        </Tooltip>
                    }>
                    <b>
                        {firstGene} Tumor Log<sub>2</sub>
                    </b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "firstTumorNum",
            label: `${firstGene} Tumor Abundance`,
            Header: (
                <OverlayTrigger overlay={<Tooltip id="first_correlation_tumor_num">{firstGene} Tumor Abundance</Tooltip>}>
                    <b>{firstGene} Tumor Abundance</b>
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
                            {secondGene} Tumor Log<sub>2</sub>
                        </Tooltip>
                    }>
                    <b>
                        {secondGene} Tumor Log<sub>2</sub>
                    </b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "secondTumorNum",
            label: `${secondGene} Tumor Abundance`,
            Header: (
                <OverlayTrigger overlay={<Tooltip id="second_tumor_num">{secondGene} Tumor Abundance</Tooltip>}>
                    <b>{secondGene} Tumor Abundance</b>
                </OverlayTrigger>
            ),
        },
        {
            accessor: "firstControl",
            label: currentTumor.includes(12) ? `${firstGene} Normal` : `${firstGene} Adjacent Normal`,
            Header: (
                <OverlayTrigger
                    overlay={
                        <Tooltip id="first_control">
                            {firstGene} {currentTumor.includes(12) ? "" : "Adjacent "}Normal Log<sub>2</sub>
                        </Tooltip>
                    }>{currentTumor.includes(12) ?
                        <b>
                            {firstGene} Normal Log<sub>2</sub>
                        </b> : <b>
                            {firstGene} Adj. Normal Log<sub>2</sub>
                        </b>}
                </OverlayTrigger>
            ),
        },
        {
            accessor: "firstControlNum",
            label: currentTumor.includes(12) ? `${firstGene} Normal Abundance` : `${firstGene} Adjacent Normal Abundance`,
            Header: (
                <OverlayTrigger
                    overlay={<Tooltip id="protein_correlation_control_num">{firstGene} {currentTumor.includes(12) ? "" : "Adjacent "}Normal Abundance</Tooltip>}>
                    {currentTumor.includes(12) ? <b>{firstGene} Normal Abundance</b> : <b>{firstGene} Adj. Normal Abundance</b>}
                </OverlayTrigger>
            ),
        },
        {
            accessor: "secondControl",
            label: currentTumor.includes(12) ?  `${secondGene} Normal` : `${secondGene} Adjacent Normal`,
            Header: (
                <OverlayTrigger
                    overlay={
                        <Tooltip id="second_control">
                            {secondGene} {currentTumor.includes(12) ? "" : "Adjacent "}Normal Log<sub>2</sub>
                        </Tooltip>
                    }>{currentTumor.includes(12) ?
                        <b>
                            {secondGene} Normal Log<sub>2</sub>
                        </b> : <b>
                            {secondGene} Adj. Normal Log<sub>2</sub>
                        </b>}
                </OverlayTrigger>
            ),
        },
        {
            accessor: "secondControlNum",
            label: currentTumor.includes(12) ? `${secondGene} Normal Abundance` : `${secondGene} Adjacent Normal Abundance`,
            Header: (
                <OverlayTrigger overlay={<Tooltip id="second_control_num">{secondGene} {currentTumor.includes(12) ? "" : "Adjacent "}Normal Abundance</Tooltip>}>
                    {currentTumor.includes(12) ? <b>{secondGene} Normal Abundance</b> : <b>{secondGene} Adj. Normal Abundance</b>}
                </OverlayTrigger>
            ),
        },
    ];

    function handleToggle(e) {
        //console.log(e.target.control.id)
        setNumType(e.target.control.id);
        //if radio, return e.target.id;
    }

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
            data: participantData.filter(c => c !== undefined && c.name).map((e) => {
                return [
                    { value: e.cancer },
                    { value: e.name },
                    { value: e.firstTumor },
                    { value: e.firstTumorNum },
                    { value: e.secondTumor },
                    { value: e.secondTumorNum },
                    { value: e.firstControl },
                    { value: e.firstControlNum },
                    { value: e.secondControl },
                    { value: e.secondControlNum },
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
                    </div>
                    <div className="row">
                        <ToggleButtonGroup
                            type="radio"
                            name="plot-tab"
                            value={numType}
                            className="col-xl-6">
                            <ToggleButton
                                className={numType === "log2" ? "btn-primary " : "btn-secondary "}
                                id="log2"
                                checked={numType === "log2"}
                                onClick={handleToggle}>
                                Using Log<sub>2</sub> values
                            </ToggleButton>
                            {currentTumor != 13 ? <ToggleButton
                                className={numType === "numeric" ? "btn-primary " : "btn-secondary "}
                                id="numeric"
                                checked={numType === "numeric"}
                                onClick={handleToggle}>
                                Using normal values converted by log<sub>2</sub> values
                            </ToggleButton> : ''}
                        </ToggleButtonGroup>

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
                    </div>
                    <Row className="mx-3 mt-3">
                        <Col xl={12}>
                            <Plot
                                data={geneScatter}
                                layout={{
                                    ...defaultLayout,
                                    title: `<b>${rnaType === "cptac" ? "CPTAC" : "TCGA"} mRNA${currentLabel ? " " + currentLabel : ""} ${firstGene} and ${secondGene} Correlation</b><br>(${numType === "log2" ? "Converted Log<sub>2</sub>" : "Normal"} Values)`,
                                    autosize: true,
                                    legend: {
                                        orientation: "h",
                                        y: -0.13,
                                        x: 0.38,
                                    },
                                    annotations: [
                                        {
                                            text: correlatedParticipantsTumor.length === 0 && correlatedParticipantsControl.lenght === 0 ? "No data available" : "",
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

                  <fieldset className="ml-5 mb-5 border" style={{ color: "grey" }}>
                        <Row>
                            <div className="col-xl-4 my-2 d-flex justify-content-center">
                            {/* Tumor Correlation:{" "}
                                {participantData.filter(
                                    (e) => e !== undefined && e.firstTumor !== "NA" && Number.isFinite(e.firstTumor) && e.secondTumor !== "NA" && Number.isFinite(e.secondTumor)).length
                                    ? calculateCorrelation(
                                    participantData
                                        .filter((f) => f.firstTumor !== "NA" && f.secondTumor !== "NA")
                                        .map((e) => (numType === "log2" ? e.firstTumor : e.firstTumorNum)),
                                        participantData
                                        .filter((f) => f.firstTumor !== "NA" && f.secondTumor !== "NA")
                                        .map((e) => (numType === "log2" ? e.secondTumor : e.secondTumorNum)),
                                    { decimals: 4 },
                                ) : "NA"} */}
                                Tumor Correlation:{" "}                               
                                {participantData.length
                                    ? (() => {
                                        const firstTumorData = participantData.filter((f) => f.firstTumor !== "NA" && f.firstTumorNum !== "NA").map((e) =>
                                        numType === "log2" ? e.firstTumor : e.firstTumorNum
                                        );
                                        console.log("firstTumorData ", firstTumorData);
                                        const secondTumorData = participantData.filter((f) => f.firstTumor !== "NA" && f.secondTumorNum !== "NA").map((e) =>
                                        numType === "log2" ? e.secondTumor : e.secondTumorNum
                                        );
                                        console.log("secondTumorData ", secondTumorData);
                                        if (!firstTumorData.every((value) => typeof value === "number") || !secondTumorData.every((value) => typeof value === "number") || firstTumorData.length !== secondTumorData.length) {
                                        return "NA";
                                        }
                                        
                                        try {
                                            const result = calculateCorrelation(firstTumorData, secondTumorData, {
                                        decimals: 4,
                                        });
                                        return isNaN(result) ? "NA" : result.toFixed(4);
                                        } catch (error){
                                            console.log(error);
                                            return "NA";
                                        }
                                        
                                    })()
                                    : "NA"}
                            </div>
                            <div className="col-xl-4 my-2 d-flex justify-content-center">
                            {currentTumor.includes(12) ? "Normal Correlation: " : "Adj. Normal Correlation: "}
                                {/* {participantData.filter( (e) => e !== undefined  && e.firstControl !== "NA" && Number.isFinite(e.firstControl)  && e.secondControl !== "NA" && Number.isFinite(e.secondControl)).length
                                ? calculateCorrelation(
                                    participantData.filter((e) => e !== undefined && e.firstControl !== "NA" && Number.isFinite(e.firstControl) && e.secondControl !== "NA" && Number.isFinite(e.secondControl))
                                        .map((e) => (numType === "log2" ? e.firstControl : e.firstControlNum)),
                                        participantData.filter((e) => e !== undefined && e.firstControl !== "NA" && Number.isFinite(e.firstControl) && e.secondControl !== "NA" && Number.isFinite(e.secondControl))
                                        .map((e) => (numType === "log2" ? e.secondControl : e.secondControlNum)),
                                    { decimals: 4 },
                                )
                                : "NA"} */}
                                {participantData.length
                                    ? (() => {
                                        const firstControlData = participantData.filter(
                                        (f) =>
                                            f.firstControl !== "NA" &&
                                            f.firstControlNum !== "NA" 
                                        ).map((e) =>
                                        numType === "log2" ? e.firstControl : e.firstControlNum
                                        );
                                        const secondControlData = participantData.filter(
                                        (f) =>
                                        f.secondControlNum !== "NA" &&
                                        f.secondControl !== "NA"
                                        
                                    ).map((e) =>
                                        numType === "log2" ? e.secondControl : e.secondControlNum
                                        );
                                        if (firstControlData.length === 0 || secondControlData.length === 0 || !firstControlData.every((value) => typeof value === "number") || !secondControlData.every((value) => typeof value === "number")) {
                                        return "NA";
                                        }
                                        try {
                                            const result = calculateCorrelation(
                                            firstControlData,
                                            secondControlData,
                                            { decimals: 4 }
                                            );
                                            return isNaN(result) ? "NA" : result.toFixed(4);
                                        } catch (error) {
                                            return "NA";
                                        }
                                       
                                    })()
                                    : "NA"}
                            </div>

                            <div className="col-xl-4 my-2 d-flex justify-content-center">
                                Total Correlation:{" "}
                                {/* {participantData.length
                                    ? calculateCorrelation(
                                        participantData
                                        .filter((e) => e !== undefined && e.firstControl !== "NA" && Number.isFinite(e.firstControl) && e.secondControl !== "NA" && Number.isFinite(e.secondControl))
                                        .map((e) => (numType === "log2" ? e.firstControl : e.firstControlNum))
                                        .concat(participantData.filter((f) => f.firstTumor !== "NA" && f.secondTumor !== "NA")
                                            .map((e) => (numType === "log2" ? e.firstTumor : e.firstTumorNum))
                                        ),
                                        participantData
                                        .filter((e) => e !== undefined && e.firstControl !== "NA" && Number.isFinite(e.firstControl) && e.secondControl !== "NA" && Number.isFinite(e.secondControl))
                                            .map((e) => (numType === "log2" ? e.secondControl : e.secondControlNum))
                                            .concat(participantData.filter((f) => f.firstTumor !== "NA" && f.secondTumor !== "NA")
                                                .map((e) => (numType === "log2" ? e.secondTumor : e.secondTumorNum))
                                            ),
                                        { decimals: 4 },
                                    )
                                    : "NA"} */}
                                    {participantData.length
                                    ? (() => {
                                        const firstControlData = participantData
                                        .filter(
                                            (f) =>
                                            f.firstControl !== "NA" &&
                                            f.firstControlNum !== "NA" && 
                                            f.secondControl !== "NA" &&
                                            f.secondControlNum !== "NA"
                                        )
                                            .map((e) =>
                                            numType === "log2" ? e.firstControl : e.firstControlNum
                                            );
                                        const firstTumorData = participantData
                                            .filter(
                                            (f) =>
                                            f.firstTumor !== "NA" &&
                                            f.firstTumorNum !== "NA" &&
                                            f.secondTumor !== "NA" &&
                                            f.secondTumorNum !== "NA" 
                                            )
                                            .map((e) => (numType === "log2" ? e.firstTumor : e.firstTumorNum));
                                        const secondControlData = participantData
                                            .filter(
                                            (f) =>
                                            f.firstControl !== "NA" &&
                                            f.firstControlNum !== "NA" && 
                                            f.secondControl !== "NA" &&
                                            f.secondControlNum !== "NA"
                                            )
                                            .map((e) =>
                                            numType === "log2" ? e.secondControl : e.secondControlNum
                                            );
                                        const secondTumorData = participantData
                                            .filter(
                                            (f) =>
                                            f.firstTumor !== "NA" &&
                                            f.firstTumorNum !== "NA" &&
                                            f.secondTumor !== "NA" &&
                                            f.secondTumorNum !== "NA" 
                                            )
                                            .map((e) => (numType === "log2" ? e.secondTumor : e.secondTumorNum));

                                        if (
                                            !firstControlData.every((value) => typeof value === "number") ||
                                            !firstTumorData.every((value) => typeof value === "number") ||
                                            !secondControlData.every((value) => typeof value === "number") ||
                                            !secondTumorData.every((value) => typeof value === "number")
                                        ) {
                                            return "NA";
                                        }
                                        try {
                                            const result = calculateCorrelation(
                                            firstControlData.concat(firstTumorData),
                                            secondControlData.concat(secondTumorData),
                                            { decimals: 4 }
                                        );
                                        return isNaN(result) ? "NA" : result.toFixed(4);
                                        } catch (error) {
                                            console.log(error);
                                            return "NA";
                                        }
                                        
                                        
                                        })()
                                    : "NA"}
                            </div>
                        </Row>
                    </fieldset>

                    <div className="">
                        <div className="d-flex" style={{ justifyContent: "flex-end" }}>
                            <ExcelFile
                                filename={currentLabel ? `${currentLabel}_ ${rnaType === "cptac" ? "CPTAC" : "TCGA"}_RNA_Correlation-${form.gene.label}-${form.correlatedGene.label}`
                                    : `${rnaType === "cptac" ? "CPTAC" : "TCGA"}_RNA_Correlation-${form.gene.label}-${form.correlatedGene.label}`}
                                element={<a href="javascript:void(0)">Export Data</a>}>

                                <ExcelSheet dataSet={exportSummarySettings()} name="Input Configuration" />
                                <ExcelSheet dataSet={exportSummary} name="RNA Abundance Data" />
                            </ExcelFile>
                        </div>

                        <Table
                            columns={correlationColumns}
                            defaultSort={[{ id: "name", asc: true }]}
                            data={participantData}
                        />
                    </div>

                </Form.Group>
            </Tab>
        </Tabs>
    )
}