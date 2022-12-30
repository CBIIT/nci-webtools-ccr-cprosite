import { useRecoilValue } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Table from "../components/table";
import TypeDropdownCorrelation from "../components/protain-correlation-dropdown"
import CorrelationToggleButton from "../components/correlation-togglebutton"

import Plot from "react-plotly.js";
import { formState, resultsState } from "./explore.state";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import calculateCorrelation from "calculate-correlation";
import { ExcelFile, ExcelSheet } from "../components/excel-export";
// import ReactExport from "react-data-export";

import { useState } from "react";

// const ExcelFile = ReactExport.ExcelFile;
// const ExcelSheet = ReactExport.ExcelFile.Excelsheet;

export default function ProteinCorrelation() {
  const form = useRecoilValue(formState);
  const results = useRecoilValue(resultsState);
  const [view, setView] = useState(form.cancer.map((e) => e.value));
  const [label, setLabel] = useState(form.cancer[0].label);
  const currentTumor = form.cancer.find((e) => e.value === view[0]) ? view : form.cancer.map((e) => e.value);

  const proteinData = results[0].participants.records.filter((e) => currentTumor.includes(e.cancerId));
  const rnaData = results[0].rna.records.filter((e) => currentTumor.includes(e.cancerId));
  const currentLabel =
    currentTumor.length > 1 ? "" : form.cancer.find((e) => e.value === view[0]) ? label : form.cancer[0].label;

  const datasetName =
    form.dataset.label === "Protein Abundance"
      ? "Protein_Abundance"
      : form.dataset.label === "Phosphorylation Site"
      ? "Phosphorylation_Site"
      : "Phosphorylation_Protein";

  const [numType, setNumType] = useState("log2");

  function handleToggle(e) {
    //console.log(e.target.control.id)
    setNumType(e.target.control.id);
    //if radio, return e.target.id;
  }

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
      accessor: "proteinTumor",
      label: "Protein Tumor Log2",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_correlation_tumor_log2">
              Protein Tumor Log<sub>2</sub>
            </Tooltip>
          }>
          <b>
            Protein Tumor Log<sub>2</sub>
          </b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "proteinTumorNum",
      label: "Protein Tumor Abundance",
      Header: (
        <OverlayTrigger overlay={<Tooltip id="protein_correlation_tumor_num">Protein Tumor Abundance</Tooltip>}>
          <b>Protein Tumor Abundance</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "rnaTumorNum",
      label: "RNA Tumor Abundance",
      Header: (
        <OverlayTrigger overlay={<Tooltip id="protein_rna_tumor_num">RNA Tumor Abundance</Tooltip>}>
          <b>RNA Tumor Abundance</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "rnaTumor",
      label: "RNA Tumor Log2",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_rna_tumor_log2">
              RNA Tumor Log<sub>2</sub>
            </Tooltip>
          }>
          <b>
            RNA Tumor Log<sub>2</sub>
          </b>
        </OverlayTrigger>
      ),
    },

    {
      accessor: "proteinControl",
      label: "Protein Adjacent Normal Log2",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_correlation_control_log2">
              Protein Adjacent Normal Log<sub>2</sub>
            </Tooltip>
          }>
          <b>
            Protein Adj. Normal Log<sub>2</sub>
          </b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "proteinControlNum",
      label: "Protein Adjacent Normal Abundance",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="protein_correlation_control_num">Protein Adjacent Normal Abundance</Tooltip>}>
          <b>Protein Adj. Normal Abundance</b>
        </OverlayTrigger>
      ),
    },

    {
      accessor: "rnaControlNum",
      label: "RNA Adjacent Normal Abundance",
      Header: (
        <OverlayTrigger overlay={<Tooltip id="protein_rna_contro_num">RNA Adjacent Normal Abundance</Tooltip>}>
          <b>RNA Adj. Normal Abundance</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "rnaControl",
      label: "RNA Adjacent Normal Log2",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_rna_contro_log2">
              RNA Adjacent Normal Log<sub>2</sub>
            </Tooltip>
          }>
          <b>
            RNA Adj. Normal Log<sub>2</sub>
          </b>
        </OverlayTrigger>
      ),
    },
  ];

  //Organize datasets (unfiltered)
  const getData = proteinData.map((e) => {
    const rna = rnaData.find((d) => {
      return e.participantId === d.participantId;
    });

    if (rna) {
      return {
        name: e.participantId,
        proteinTumor: e.tumorValue !== null ? Number(e.tumorValue.toFixed(4)) : "NA",
        proteinTumorNum: e.tumorValue !== null ? Number(Math.pow(2, e.tumorValue).toFixed(4)) : "NA",
        proteinControl: e.normalValue !== null ? Number(e.normalValue.toFixed(4)) : "NA",
        proteinControlNum: e.normalValue !== null ? Number(Math.pow(2, e.normalValue).toFixed(4)) : "NA",
        //Converting rna value to log values
        rnaTumor: rna.tumorValue !== null ? Number(Math.log2(rna.tumorValue).toFixed(4)) : "NA",
        rnaTumorNum: rna.tumorValue !== null ? rna.tumorValue : "NA",
        rnaControl: rna.normalValue !== null ? Number(Math.log2(rna.normalValue).toFixed(4)) : "NA",
        rnaControlNum: rna.normalValue !== null ? rna.normalValue : "NA",
      };
    } else {
      return {
        name: null,
        proteinTumor: null,
        proteinTumorNum: null,
        proteinControl: null,
        proteinControlNum: null,
        //Converting rna value to log values
        rnaTumor: null,
        rnaTumorNum: null,
        rnaControl: null,
        rnaControlNum: null,
      };
    }
  });

  //Filter points with missing data points that would cause issues with correlation calculation
  const proteinRNA = getData.filter(
    (e) => e.proteinTumor !== null && e.rnaTumor !== null && e.proteinControl !== null && e.rnaControl !== null,
  );

  const correlationData = proteinRNA.filter(
    (e) => e.proteinTumor !== "NA" && e.rnaTumor !== "NA" && e.proteinControl !== "NA" && e.rnaControl !== "NA",
  );

  const defaultLayout = {
    xaxis: {
      title: "<b>Protein</b>",
      zeroline: false,
      titlefont: {
        size: 16,
      },
    },
    yaxis: {
      title: "<b>mRNA</b>",
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

  function exportSummarySettings() {
    var settings = form.cancer
      .filter((f) => currentTumor.find((c) => c === f.value))
      .map((e) => {
        return [{ value: e.label }];
      });
    settings[0].push({ value: "Protein Abundance" });
    settings[0].push({ value: "Correlation" });
    settings[0].push({ value: form.gene.label });

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

  const exportSummary = [
    {
      columns: correlationColumns.map((e) => {
        return { title: e.label, width: { wpx: 160 } };
      }),
      data: proteinRNA.map((e) => {
        return [
          { value: e.name },
          { value: e.proteinTumorNum },
          { value: e.proteinTumor },
          { value: e.rnaTumorNum },
          { value: e.rnaTumor },
          { value: e.proteinControlNum },
          { value: e.proteinControl },
          { value: e.rnaControlNum },
          { value: e.rnaControl },
        ];
      }),
    },
  ];

  const proteinRNAScatter = [
    {
      x: proteinRNA.map((e) => (numType === "log2" ? e.proteinTumor : Math.pow(2, e.proteinTumor))),
      y: proteinRNA.map((e) => (numType === "log2" ? e.rnaTumor : Math.pow(2, e.rnaTumor))),
      marker: {
        size: 8,
        color: "rgb(255,0,0)",
      },
      mode: "markers",
      type: "scatter",
      name: "Tumor",
      text: proteinRNA.map((e) =>  e.name),
      hovertemplate: `Patient ID: %{text}<br>Protein Tumor ${numType === "log2" ? "Log2" : "Abundance"}: %{x}<br>RNA Tumor ${
        numType === "log2" ? "Log2" : "Abundance"
      }: %{y})<extra></extra>`,
    },
    {
      x: proteinRNA.map((e) => (numType === "log2" ? e.proteinControl : Math.pow(2, e.proteinControl))),
      y: proteinRNA.map((e) => (numType === "log2" ? e.rnaControl : Math.pow(2, e.rnaControl))),
      marker: {
        size: 8,
        color: "rgb(31,119,180)",
      },
      mode: "markers",
      type: "scatter",
      name: "Adjacent Normal",
      text: proteinRNA.map((e) =>  e.name),
      hovertemplate: `Patient ID: %{text}<br>Protein Control ${numType === "log2" ? "Log2" : "Abundance"}: %{x}<br>RNA Control ${
        numType === "log2" ? "Log2" : "Abundance"
      }: %{y})<extra></extra>`,
    },
  ];
  {console.log(results)}
  return (
    <div>
      <Form.Group className="row mx-3 m-3 " controlId="tumorView">
      { form.cancer.length > 1 ? <Form.Label className="col-xl-1 col-xs-12 col-form-label m-3" style={{minWidth:"120px"}}>
          Tumor Type
        </Form.Label>
        : ''}
        { form.cancer.length > 1 ? 
        <div className="col-xl-7 m-3">
          <TypeDropdownCorrelation form={form} view={view} setView={setView} setLabel={setLabel}>  
           </TypeDropdownCorrelation>
        </div> : ''}
        
      <CorrelationToggleButton numType={numType} handleToggle={handleToggle}></CorrelationToggleButton>
      
      </Form.Group> 
     
      <Row className="mx-3 mt-3">
        <Col xl={12}>
          <Plot
            data={proteinRNAScatter}
            layout={{
              ...defaultLayout,
              title: `<b>${form.dataset.label} ${form.gene.label} and mRNA Correlation</b><br>(${
                numType === "log2" ? "Log<sub>2</sub>" : "Converted Normal"
              } Values)`,
              autosize: true,
              legend: {
                orientation: "h",
                y: -0.2,
                x: 0.42,
              },
              annotations: [
                {
                  text:
                    proteinRNAScatter[0].x.length === 0 && proteinRNAScatter[1].x.length === 0
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
            config={{
              ...defaultConfig,
              toImageButtonOptions: {
                ...defaultConfig.toImageButtonOptions,
                filename: `${currentLabel ? currentLabel + "_" : ""}${datasetName}_Correlation-${form.gene.label}`,
              },
            }}
            useResizeHandler
            className="flex-fill w-100"
            style={{ height: "800px" }}
          />
        </Col>
      </Row>

      <fieldset className="mx-5 mb-5 border" style={{ color: "grey" }}>
        <Row>
          <div className="col-xl-4 my-2 d-flex justify-content-center">
            Tumor Correlation:{" "}
            {proteinRNA.filter((f) => f.proteinTumor !== "NA" && f.rnaTumor !== "NA").length
              ? calculateCorrelation(
                  proteinRNA
                    .filter((f) => f.proteinTumor !== "NA" && f.rnaTumor !== "NA")
                    .map((e) => (numType === "log2" ? e.proteinTumor : Math.pow(2, e.proteinTumor))),
                  proteinRNA
                    .filter((f) => f.proteinTumor !== "NA" && f.rnaTumor !== "NA")
                    .map((e) => (numType === "log2" ? e.rnaTumor : Math.pow(2, e.rnaTumor))),
                  { decimals: 4 },
                )
              : "NA"}
          </div>
          <div className="col-xl-4 my-2 d-flex justify-content-center">
            Adj. Normal Correlation:{" "}
            {proteinRNA.filter((f) => f.proteinControl !== "NA" && f.rnaControl !== "NA").length
              ? calculateCorrelation(
                  proteinRNA
                    .filter((f) => f.proteinControl !== "NA" && f.rnaControl !== "NA")
                    .map((e) => (numType === "log2" ? e.proteinControl : Math.pow(2, e.proteinControl))),
                  proteinRNA
                    .filter((f) => f.proteinControl !== "NA" && f.rnaControl !== "NA")
                    .map((e) => (numType === "log2" ? e.rnaControl : Math.pow(2, e.rnaControl))),
                  { decimals: 4 },
                )
              : "NA"}
          </div>

          <div className="col-xl-4 my-2 d-flex justify-content-center">
            Total Correlation:{" "}
            {correlationData.length
              ? calculateCorrelation(
                  correlationData
                    .map((e) => (numType === "log2" ? e.proteinControl : Math.pow(2, e.proteinControl)))
                    .concat(
                      correlationData.map((e) => (numType === "log2" ? e.proteinTumor : Math.pow(2, e.proteinTumor))),
                    ),
                  correlationData
                    .map((e) => (numType === "log2" ? e.rnaControl : Math.pow(2, e.rnaControl)))
                    .concat(correlationData.map((e) => (numType === "log2" ? e.rnaTumor : Math.pow(2, e.rnaTumor)))),
                  { decimals: 4 },
                )
              : "NA"}
          </div>
        </Row>
      </fieldset>

      <div className="m-3">
        <div className="d-flex" style={{ justifyContent: "flex-end" }}>
          <ExcelFile
            filename={`${currentLabel ? currentLabel + "_" : ""}${datasetName}_Correlation-${form.gene.label}`}
            element={<a href="javascript:void(0)">Export Data</a>}>
            <ExcelSheet dataSet={exportSummarySettings()} name="Input Configuration" />
            <ExcelSheet dataSet={exportSummary} name="Summary Data" />
          </ExcelFile>
        </div>
        <Table
          columns={correlationColumns}
          defaultSort={[{ id: "name", asec: true }]}
          data={proteinRNA.map((c) => {
            return {
              name: c.name,
              proteinTumor: c.proteinTumor,
              proteinTumorNum: c.proteinTumorNum,
              proteinControl: c.proteinControl,
              proteinControlNum: c.proteinControlNum,
              rnaTumor: c.rnaTumor,
              rnaTumorNum: c.rnaTumorNum,
              rnaControl: c.rnaControl,
              rnaControlNum: c.rnaControlNum,
            };
          })}
        />
      </div>
    </div>
  );
}
