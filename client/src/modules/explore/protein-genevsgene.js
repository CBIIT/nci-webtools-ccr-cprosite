import { useRecoilValue } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Form from "react-bootstrap/Form";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import ToggleButton from "react-bootstrap/esm/ToggleButton";
import Table from "../components/table";
import Plot from "react-plotly.js";
import { formState, resultsState } from "./explore.state";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import calculateCorrelation from "calculate-correlation";
import ReactExport from "react-data-export";

import { useState } from "react";
import _ from "lodash";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.Excelsheet;

export default function ProteinGeneCorrelation() {
  const form = useRecoilValue(formState);
  const tumors = form.cancer.map((e) => e.value);
  const firstGene = form.gene.label;
  const secondGene = form.correlatedGene.label;
  const results = useRecoilValue(resultsState);

  var firstGeneSet = [];
  results
    .filter((e) => e.gene.value === form.gene.value)
    .map((e) => {
      firstGeneSet = firstGeneSet.concat(e.participants.records);
    });

  var secondGeneSet = [];
  results
    .filter((e) => e.gene.value === form.correlatedGene.value)
    .map((e) => {
      secondGeneSet = secondGeneSet.concat(e.participants.records);
    });

  const [view, setView] = useState(form.cancer[0].value);
  const [tab, setTab] = useState("summary");
  const [numType, setNumType] = useState("log2");

  console.log(firstGeneSet);
  console.log(secondGeneSet);

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
      accessor: "firstTumor",
      label: `${firstGene} Tumor Log2`,
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="first_correlation_tumor_log2">
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
        <OverlayTrigger
          overlay={
            <Tooltip id="first_correlation_tumor_num">
              {firstGene} Tumor Abundance
            </Tooltip>
          }>
          <b>{firstGene} Tumor Abundance</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "secondTumor",
      label: `${secondGene} Tumor Log2`,
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="second_tumor_log2">
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
        <OverlayTrigger
          overlay={
            <Tooltip id="second_tumor_num">RNA Tumor Abundance</Tooltip>
          }>
          <b>RNA Tumor Abundance</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "firstControl",
      label: `${firstGene} Adjacent Normal Log2`,
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="first_correlation_control_log2">
              ${firstGene} Adjacent Normal Log<sub>2</sub>
            </Tooltip>
          }>
          <b>
            {firstGene} Adj. Normal Log<sub>2</sub>
          </b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "firstControlNum",
      label: `${firstGene} Adjacent Normal Abundance`,
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_correlation_control_num">
              {firstGene} Adjacent Normal Abundance
            </Tooltip>
          }>
          <b>{firstGene} Adj. Normal Abundance</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "secondControl",
      label: `${secondGene} Adjacent Normal Log2`,
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="second_control_log2">
              {secondGene} Adjacent Normal Log<sub>2</sub>
            </Tooltip>
          }>
          <b>
            {secondGene} Adj. Normal Log<sub>2</sub>
          </b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "secondControlNum",
      label: `${secondGene} Adjacent Normal Abundance`,
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="second_control_num">
              {secondGene} Adjacent Normal Abundance
            </Tooltip>
          }>
          <b>{secondGene} Adj. Normal Abundance</b>
        </OverlayTrigger>
      ),
    },
  ];

  //Organize datasets (unfiltered)
  const getData = firstGeneSet.map((first) => {
    const second = secondGeneSet.find((d) => {
      return first.participantId === d.participantId;
    });

    if (second) {
      return {
        name: first.participantId,
        firstTumor: first.tumorValue,
        firstTumorNum:
          first.tumorValue !== null
            ? Number(Math.pow(2, first.tumorValue).toFixed(4))
            : null,
        firstControl: first.normalValue,
        firstControlNum:
          first.normalValue !== null
            ? Number(Math.pow(2, first.normalValue).toFixed(4))
            : null,
        secondTumor: second.tumorValue,
        secondTumorNum:
          second.tumorValue !== null
            ? Number(Math.pow(2, second.tumorValue).toFixed(4))
            : null,
        secondControl: second.normalValue,
        secondControlNum:
          second.normalValue !== null
            ? Number(Math.pow(2, second.normalValue).toFixed(4))
            : null,
      };
    } else {
      return {
        name: null,
        firstTumor: null,
        firstTumorNum: null,
        firstControl: null,
        firstControlNum: null,
        secondTumor: null,
        secondControl: null,
        secondControlNum: null,
      };
    }
  });

  //Filter points with missing data points that would cause issues with correlation calculation
  const proteinGene = getData.filter(
    (e) => e.firstTumor && e.firstControl && e.secondTumor && e.secondControl,
  );

  const defaultLayout = {
    xaxis: {
      title: firstGene,
      zeroline: false,
    },
    yaxis: {
      title: secondGene,
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

  const geneScatter = [
    {
      x: proteinGene.map((e) =>
        numType === "log2" ? e.firstTumor : e.firstTumorNum,
      ),
      y: proteinGene.map((e) =>
        numType === "log2" ? e.secondTumor : e.secondTumorNum,
      ),
      mode: "markers",
      type: "scatter",
      name: "Tumor",
      hovertemplate: "(%{x},%{y})<extra></extra>",
    },
    {
      x: proteinGene.map((e) =>
        numType === "log2" ? e.firstControl : e.firstControlNum,
      ),
      y: proteinGene.map((e) =>
        numType === "log2" ? e.secondControl : e.secondControlNum,
      ),
      mode: "markers",
      type: "scatter",
      name: "Adjacent Normal",
      hovertemplate: "(%{x},%{y})<extra></extra>",
    },
  ];

  function exportSummarySettings() {
    var settings = form.cancer.map((e) => {
      return [{ value: e.label }];
    });
    settings[0].push({ value: "Protein Abundance" });
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
      data: proteinGene.map((e) => {
        return [
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

  return (
    <Tabs activeKey={tab} onSelect={(e) => setTab(e)} className="mb-3">
      <Tab eventKey="summary" title="Correlation">
        <Form.Group className="row mx-3" controlId="tumorView">
          <Form.Label
            className="col-xl-1 col-xs-12 col-form-label"
            style={{ minWidth: "120px" }}>
            Tumor Type
          </Form.Label>
          <div className="col-xl-3">
            <Form.Select
              name="caseView"
              onChange={(e) => {
                setView(parseInt(e.target.value));
              }}
              value={view}
              required>
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
              data={geneScatter}
              layout={{
                ...defaultLayout,
                title: `<b>${firstGene} and ${secondGene} Correlation</b>`,
                autosize: true,
                legend: {
                  orientation: "h",
                  y: -0.2,
                  x: 0.37,
                },
                annotations: [
                  {
                    text: proteinGene.length === 0 ? "No data available" : "",
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
              {proteinGene.length
                ? calculateCorrelation(
                    proteinGene.map((e) =>
                      numType === "log2" ? e.firstTumor : e.firstTumorNum,
                    ),
                    proteinGene.map((e) =>
                      numType === "log2" ? e.secondTumor : e.secondTumorNum,
                    ),
                    { decimals: 4 },
                  )
                : "NA"}
            </div>
            <div className="col-xl-4 my-2 d-flex justify-content-center">
              Control Correlation:{" "}
              {proteinGene.length
                ? calculateCorrelation(
                    proteinGene.map((e) =>
                      numType === "log2" ? e.firstControl : e.firstControlNum,
                    ),
                    proteinGene.map((e) =>
                      numType === "log2" ? e.secondControl : e.secondControlNum,
                    ),
                    { decimals: 4 },
                  )
                : "NA"}
            </div>

            <div className="col-xl-4 my-2 d-flex justify-content-center">
              Total Correlation:{" "}
              {proteinGene.length
                ? calculateCorrelation(
                    proteinGene
                      .map((e) =>
                        numType === "log2" ? e.firstControl : e.firstControlNum,
                      )
                      .concat(
                        proteinGene.map((e) =>
                          numType === "log2" ? e.firstTumor : e.firstTumorNum,
                        ),
                      ),
                    proteinGene
                      .map((e) =>
                        numType === "log2"
                          ? e.secondControl
                          : e.secondControlNum,
                      )
                      .concat(
                        proteinGene.map((e) =>
                          numType === "log2" ? e.secondTumor : e.secondTumorNum,
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
            <ExcelFile element={<a href="javascript:void(0)">Export Data</a>}>
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
            data={proteinGene.map((c) => {
              return {
                name: c.name,
                firstTumor: c.firstTumor,
                firstTumorNum: c.firstTumorNum,
                secondTumor: c.secondTumor,
                secondTumorNum: c.secondTumorNum,
                firstControl: c.firstControl,
                firstControlNum: c.firstControlNum,
                secondControl: c.secondControl,
                secondControlNum: c.secondControlNum,
              };
            })}
          />
        </div>
      </Tab>
    </Tabs>
  );
}
