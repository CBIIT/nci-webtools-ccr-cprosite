import { useRecoilValue } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Table from "../components/table";
import Plot from "react-plotly.js";
import { formState, resultsState } from "./explore.state";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import calculateCorrelation from "calculate-correlation";
import ReactExport from "react-data-export";

import { useState } from "react";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.Excelsheet;

export default function ProteinCorrelation() {
  const form = useRecoilValue(formState);
  const results = useRecoilValue(resultsState);
  const [view, setView] = useState(form.cancer.map((e) => e.value));
  const [label, setLabel] = useState("");

  var proteinData = [];
  var rnaData = [];

  results
    .filter((e) => view.includes(e.cancer.value))
    .map((e) => {
      proteinData = proteinData.concat(e.participants.records);
      rnaData = rnaData.concat(e.rna.records);
    });

  const [numType, setNumType] = useState("log2");

  function handleToggle(e) {
    setNumType(e.target.id);
  }

  const correlationColumns = [
    {
      accessor: "name",
      id: "name",
      label: "Patient ID",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_correlation_patient">Patient ID</Tooltip>
          }>
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
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_correlation_tumor_num">
              Protein Tumor Abundance
            </Tooltip>
          }>
          <b>Protein Tumor Abundance</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "rnaTumorNum",
      label: "RNA Tumor Abundance",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_rna_tumor_num">RNA Tumor Abundance</Tooltip>
          }>
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
          overlay={
            <Tooltip id="protein_correlation_control_num">
              Protein Adjacent Normal Abundance
            </Tooltip>
          }>
          <b>Protein Adj. Normal Abundance</b>
        </OverlayTrigger>
      ),
    },

    {
      accessor: "rnaControlNum",
      label: "RNA Adjacent Normal Abundance",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_rna_contro_num">
              RNA Adjacent Normal Abundance
            </Tooltip>
          }>
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
        proteinTumor: e.tumorValue,
        proteinTumorNum:
          e.tumorValue !== null
            ? Number(Math.pow(2, e.tumorValue).toFixed(4))
            : null,
        proteinControl: e.normalValue,
        proteinControlNum:
          e.normalValue !== null
            ? Number(Math.pow(2, e.normalValue).toFixed(4))
            : null,
        //Converting rna value to log values
        rnaTumor: rna.tumorValue
          ? Number(Math.log2(rna.tumorValue).toFixed(4))
          : null,
        rnaTumorNum: rna.tumorValue,
        rnaControl: rna.normalValue
          ? Number(Math.log2(rna.normalValue).toFixed(4))
          : null,
        rnaControlNum: rna.normalValue,
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
    (e) => e.proteinTumor && e.rnaTumor && e.proteinControl && e.rnaControl,
  );

  const defaultLayout = {
    xaxis: {
      title: "Protein",
      zeroline: false,
    },
    yaxis: {
      title: "mRNA",
      zeroline: false,
    },
    legend: {
      itemsizing: "constant",
      itemwidth: 40,
    },
    hovermode: "closest",
    hoverlabel: {
      bgcolor: "#FFF",
      font: { color: "#000" },
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
    modeBarButtonsToRemove: [
      "select2d",
      "lasso2d",
      "hoverCompareCartesian",
      "hoverClosestCartesian",
    ],
  };

  function exportSummarySettings() {
    var settings = form.cancer.map((e) => {
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

  function getTimestamp() {
    const date = new Date();

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return year + month + day + minutes + seconds;
  }

  const proteinRNAScatter = [
    {
      x: proteinRNA.map((e) =>
        numType === "log2" ? e.proteinTumor : Math.pow(2, e.proteinTumor),
      ),
      y: proteinRNA.map((e) =>
        numType === "log2" ? e.rnaTumor : Math.pow(2, e.rnaTumor),
      ),
      mode: "markers",
      type: "scatter",
      name: "Tumor",
      hovertemplate: "(%{x},%{y})<extra></extra>",
    },
    {
      x: proteinRNA.map((e) =>
        numType === "log2" ? e.proteinControl : Math.pow(2, e.proteinControl),
      ),
      y: proteinRNA.map((e) =>
        numType === "log2" ? e.rnaControl : Math.pow(2, e.rnaControl),
      ),
      mode: "markers",
      type: "scatter",
      name: "Adjacent Normal",
      hovertemplate: "(%{x},%{y})<extra></extra>",
    },
  ];

  return (
    <div>
      <Form.Group className="row m-3" controlId="tumorView">
        <Form.Label
          className="col-xl-1 col-xs-12 col-form-label"
          style={{ minWidth: "120px" }}>
          Tumor Type
        </Form.Label>
        <div className="col-xl-3">
          <Form.Select
            name="caseView"
            onChange={(e) => {
              if (e.target.value === "all") {
                setView(form.cancer.map((e) => e.value));
                setLabel("");
              } else {
                setView([parseInt(e.target.value)]);
                setLabel(
                  form.cancer.find((d) => d.value === parseInt(e.target.value))
                    .label,
                );
              }
            }}
            value={view}
            required>
            <option value="all" key={`dataset-all`}>
              All Tumor Types
            </option>
            {form.cancer.map((o) => (
              <option value={o.value} key={`dataset-${o.value}`}>
                {o.label}
              </option>
            ))}
          </Form.Select>
        </div>
        {/*<ToggleButtonGroup
            type="radio"
            name="plot-tab"
            value={numType}
            className="col-xl-5">
            <ToggleButton
              className={numType === "log2" ? "btn-primary" : "btn-secondary"}
              id={"log2"}
              onClick={handleToggle}>
              Log<sub>2</sub> vs Log<sub>2</sub>
            </ToggleButton>
            <ToggleButton
              className={
                numType === "numeric" ? "btn-primary" : "btn-secondary"
              }
              id={"numeric"}
              onClick={handleToggle}>
              Numeric vs Numeric
            </ToggleButton>
            </ToggleButtonGroup>*/}
        <Form.Group className="col-xl-6 mb-3 col-form-label">
          <Form.Check
            inline
            label={
              <span>
                Log<sub>2</sub> vs Log<sub>2</sub>
              </span>
            }
            type="radio"
            id="log2"
            value="numType"
            checked={numType === "log2"}
            onChange={handleToggle}
          />

          <Form.Check
            inline
            label="Numeric vs Numeric"
            type="radio"
            id="numeric"
            value="numType"
            checked={numType === "numeric"}
            onChange={handleToggle}
          />
        </Form.Group>
      </Form.Group>

      <Row className="mx-3 mt-3">
        <Col xl={12}>
          <Plot
            data={proteinRNAScatter}
            layout={{
              ...defaultLayout,
              title: `<b>${label} Protein and mRNA Correlation</b> (Gene: ${form.gene.label})`,
              autosize: true,
              legend: {
                orientation: "h",
                y: -0.2,
                x: 0.37,
              },
              annotations: [
                {
                  text: proteinRNA.length === 0 ? "No data available" : "",
                  xref: "paper",
                  yref: "paper",
                  showarrow: false,
                  font: {
                    size: 28,
                  },
                },
              ],
            }}
            config={defaultConfig}
            useResizeHandler
            className="flex-fill w-100"
            style={{ height: "500px" }}
          />
        </Col>
      </Row>

      <fieldset className="mx-5 mb-5 border" style={{ color: "grey" }}>
        <Row>
          <div className="col-xl-4 my-2 d-flex justify-content-center">
            Tumor Correlation:{" "}
            {proteinRNA.length
              ? calculateCorrelation(
                  proteinRNA.map((e) =>
                    numType === "log2"
                      ? e.proteinTumor
                      : Math.pow(2, e.proteinTumor),
                  ),
                  proteinRNA.map((e) =>
                    numType === "log2" ? e.rnaTumor : Math.pow(2, e.rnaTumor),
                  ),
                  { decimals: 4 },
                )
              : "NA"}
          </div>
          <div className="col-xl-4 my-2 d-flex justify-content-center">
            Control Correlation:{" "}
            {proteinRNA.length
              ? calculateCorrelation(
                  proteinRNA.map((e) =>
                    numType === "log2"
                      ? e.proteinControl
                      : Math.pow(2, e.proteinControl),
                  ),
                  proteinRNA.map((e) =>
                    numType === "log2"
                      ? e.rnaControl
                      : Math.pow(2, e.rnaControl),
                  ),
                  { decimals: 4 },
                )
              : "NA"}
          </div>

          <div className="col-xl-4 my-2 d-flex justify-content-center">
            Total Correlation:{" "}
            {proteinRNA.length
              ? calculateCorrelation(
                  proteinRNA
                    .map((e) =>
                      numType === "log2"
                        ? e.proteinControl
                        : Math.pow(2, e.proteinControl),
                    )
                    .concat(
                      proteinRNA.map((e) =>
                        numType === "log2"
                          ? e.proteinTumor
                          : Math.pow(2, e.proteinTumor),
                      ),
                    ),
                  proteinRNA
                    .map((e) =>
                      numType === "log2"
                        ? e.rnaControl
                        : Math.pow(2, e.rnaControl),
                    )
                    .concat(
                      proteinRNA.map((e) =>
                        numType === "log2"
                          ? e.rnaTumor
                          : Math.pow(2, e.rnaTumor),
                      ),
                    ),
                  { decimals: 4 },
                )
              : "NA"}
          </div>
        </Row>
      </fieldset>

      <div className="m-3">
        <div className="d-flex" style={{ justifyContent: "flex-end" }}>
          <ExcelFile
            filename={`CPROSITE-${
              form.dataset.value === "proteinData"
                ? "ProteinAbundance"
                : "Phosphorylation"
            }-Correlation-${getTimestamp()}`}
            element={<a href="javascript:void(0)">Export Data</a>}>
            <ExcelSheet
              dataSet={exportSummarySettings()}
              name="Input Configuration"
            />
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
