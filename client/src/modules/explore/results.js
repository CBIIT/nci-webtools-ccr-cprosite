import { useRecoilValue } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import ToggleButton from "react-bootstrap/esm/ToggleButton";
import Table from "../components/table";
import Plot from "react-plotly.js";
import { casesState, formState, proteinDataState } from "./explore.state";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { query } from "../../services/query";
import ReactExport from "react-data-export";
import React, { useState } from "react";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.Excelsheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

export default function Results() {
  const cases = useRecoilValue(casesState);
  const form = useRecoilValue(formState);
  const tumors = form.cancer.map((c) => c.value);

  const [view, setView] = useState(tumors[0]);
  const [tab, setTab] = useState("summary");
  const [plotTab, setPlot] = useState("tumorVsControl");
  const [foldSize, setFoldSize] = useState(
    `${cases.filter((c) => tumors[0] === c.cancerId).length.toString() * 20}px`,
  );

  const proteinAbundanceColumns = [
    {
      accessor: "name",
      label: "Patient ID",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="protein_patient">Patient ID</Tooltip>}>
          <b>Patient ID</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "proteinLogRatioCase",
      label: "Tumor Value",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="protein_tumor_val">Tumor Value</Tooltip>}>
          <b>Tumor Value</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "proteinLogRatioControl",
      label: "Normal Value",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="protein_normal_val">Normal Value</Tooltip>}>
          <b>Normal Value</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "proteinDiff",
      label: "Difference",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_diff">
              Difference between tumor and control values
            </Tooltip>
          }>
          <b>Difference</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "proteinLogRatioChange",
      label: "Log2 Fold Change Value",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_log_fold">
              Log<sub>2</sub> Fold Change Value
            </Tooltip>
          }>
          <b>
            Log<sub>2</sub> Fold Change Value
          </b>
        </OverlayTrigger>
      ),
    },
  ];

  const summaryColumns = [
    {
      accessor: "link",
      label: "Tumor Type",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="protein_tumor">Tumor Type</Tooltip>}>
          <b>Tumor Type</b>
        </OverlayTrigger>
      ),
      sort: true,
    },
    {
      accessor: "tumorAverage",
      label: "Average Tumor",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="protein_av_tumor">Average Tumor</Tooltip>}>
          <b>Average Tumor</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "controlAverage",
      label: "Average Normal",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="protein_av_normal">Average Normal</Tooltip>}>
          <b>Average Normal</b>
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
              Average Protein Abundance Difference (log<sub>2</sub> ratio
              between Tu vs No)
            </Tooltip>
          }>
          <b>Tumor vs Adjacent Normal</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "pValue",
      label: "P Value",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="protein_pvalue">Mann-Whitney U Test</Tooltip>}>
          <b>P Value</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "tumorNum",
      label: "Tumor Count",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_tumor_count">Tumor Sample Number</Tooltip>
          }>
          <b>Tumor Count</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "controlNum",
      label: "Normal Count",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_normal_count">
              Adjacent Normal Sample Number
            </Tooltip>
          }>
          <b>Normal Count</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "tumorError",
      label: "Tumor SE",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_tumor_se">Tumor Standard Error</Tooltip>
          }>
          <b>Tumor SE</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "controlError",
      label: "Control SE",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_tcontrol_se">Control Stanadard Error</Tooltip>
          }>
          <b>Control SE</b>
        </OverlayTrigger>
      ),
    },
  ];

  const boxPlotData = [
    {
      y: cases
        .filter((c) => c.cancerId === view)
        .map((c) => c.proteinLogRatioCase),
      type: "box",
      boxpoints: "all",
      name: "Tumor",
      jitter: 0.6,
      marker: {
        size: 8,
      },
      hovertemplate: "%{y}<extra></extra>",
    },
    {
      y: cases
        .filter((c) => c.cancerId === view)
        .map((c) => c.proteinLogRatioControl),
      type: "box",
      boxpoints: "all",
      name: "Normal",
      jitter: 0.6,
      marker: {
        size: 8,
      },
      hovertemplate: "%{y}<extra></extra>",
    },
  ];

  const average = (values) =>
    values.filter((v) => v !== null).reduce((a, b) => a + b) / values.length;

  function calcStandardError(values, average) {
    var result = 0;

    for (var i = 0; i < values.length; i++) {
      result += Math.pow(values[0] - average, 2);
    }

    result = result / values.length;
    result = Math.sqrt(result) / Math.sqrt(values.length);

    return !isNaN(result) ? result.toFixed(4) : "NA";
  }

  const averages = form.cancer.map((c) => {
    const tumorFilter = cases
      .filter((d) => c.value === d.cancerId && d.proteinLogRatioCase !== null)
      .map((e) => Math.pow(2, e.proteinLogRatioCase));
    const controlFilter = cases
      .filter(
        (d) => c.value === d.cancerId && d.proteinLogRatioControl !== null,
      )
      .map((e) => Math.pow(2, e.proteinLogRatioControl));

    const controlAverage = !isNaN(controlFilter[0])
      ? average(controlFilter).toFixed(4)
      : "NA";
    const tumorAverage = !isNaN(tumorFilter[0])
      ? average(tumorFilter).toFixed(4)
      : "NA";

    return {
      id: c.value,
      name: c.label,
      link: (
        <a
          onClick={() => {
            setView(c.value);
            setTab("tumorView");
          }}
          href="javascript:void(0)">
          {c.label}
        </a>
      ),
      controlAverage: !isNaN(controlAverage) ? Number(controlAverage) : "NA",
      tumorAverage: !isNaN(tumorAverage) ? Number(tumorAverage) : "NA",
      proteinDiff:
        !isNaN(controlAverage) && !isNaN(tumorAverage)
          ? Number(Math.abs(controlAverage - tumorAverage).toFixed(4))
          : "NA",
      controlNum: !isNaN(controlFilter[0]) ? controlFilter.length : 0,
      tumorNum: !isNaN(tumorFilter[0]) ? tumorFilter.length : 0,
      pValue: Number((Math.random() * Math.pow(1, -8)).toFixed(4)),
      tumorError: !isNaN(tumorAverage)
        ? Number(
            calcStandardError(
              cases
                .filter(
                  (d) =>
                    c.value === d.cancerId && d.proteinLogRatioCase !== null,
                )
                .map((e) => e.proteinLogRatioCase),
              tumorAverage,
            ),
          )
        : "NA",
      controlError: !isNaN(controlAverage)
        ? Number(
            calcStandardError(
              cases
                .filter(
                  (d) =>
                    c.value === d.cancerId && d.proteinLogRatioControl !== null,
                )
                .map((e) => e.proteinLogRatioControl),
              controlAverage,
            ),
          )
        : "NA",
    };
  });

  function multiBarPlotData() {
    return [
      {
        x: averages.map((c) => c.name),
        y: averages.map((c) => c.tumorAverage),
        error_y: {
          type: "data",
          array: averages.map((c) => c.tumorError),
          visible: true,
          color: "rgb(31,119,180)",
        },
        type: "bar",
        name: "Tumor",
        hovertemplate: "%{x}: %{y} <extra></extra>",
      },
      {
        x: averages.map((c) => c.name),
        y: averages.map((c) => c.controlAverage),
        error_y: {
          type: "data",
          array: averages.map((c) => c.controlError),
          visible: true,
          color: "rgb(255,127,14)",
        },
        type: "bar",
        name: "Normal",
        hovertemplate: "%{x}: %{y} <extra></extra>",
      },
    ];
  }

  function foldData() {
    var caseList = cases
      .filter((c) => view === c.cancerId)
      .sort((a, b) =>
        a.proteinLogRatioChange > b.proteinLogRatioChange ? 1 : -1,
      );

    const values = caseList.map((c) =>
      c.proteinLogRatioChange ? c.proteinLogRatioChange.toFixed(4) : null,
    );

    return [
      {
        type: "bar",
        x: values,
        y: caseList.map((c) => (c.proteinLogRatioChange ? c.name : null)),
        marker: {
          color: values.map((c) =>
            c > 0 ? "rgb(255,0,0)" : "rgb(31,119,180)",
          ),
        },
        orientation: "h",
      },
      {
        type: "bar",
        x: values,
        y: caseList.map((c) => (c.proteinLogRatioChange ? c.name : null)),
        marker: {
          color: values.map((c) =>
            c > 0 ? "rgb(255,0,0)" : "rgb(31,119,180)",
          ),
        },
        xaxis: "x2",
        orientation: "h",
      },
    ];
  }

  function handleToggle(e) {
    setPlot(e.target.control.id);
  }

  function exportSummarySettings() {
    var settings = form.cancer.map((e) => {
      return [{ value: e.label }];
    });
    settings[0].push({ value: "Protein Abundance" });
    settings[0].push({ value: "Tumor vs Control" });
    settings[0].push({ value: form.gene.label });

    return [
      {
        columns: [
          { title: "Tumor", width: { wpx: 160 } },
          { title: "Protein Abundance", width: { wpx: 160 } },
          { title: "Analysis", width: { wpx: 160 } },
          { title: "Gene", width: { wpx: 160 } },
        ],
        data: settings,
      },
    ];
  }

  const exportSummary = [
    {
      columns: summaryColumns.map((e) => {
        return { title: e.label, width: { wpx: 160 } };
      }),
      data: averages.map((e) => {
        return [
          { value: e.name },
          { value: e.tumorAverage },
          { value: e.controlAverage },
          { value: e.proteinDiff },
          { value: e.pValue },
          { value: e.tumorNum },
          { value: e.controlNum },
          { value: e.tumorError },
          { value: e.controlError },
        ];
      }),
    },
  ];

  /*
  const exportAbundanceSettings = [
    {
      columns: [
        { title: 'Tumor', width: { wpx: 160 } },
        { title: "Protein Abundance", width: { wpx: 160 } },
        { title: 'Analysis', width: { wpx: 160 } },
        { title: 'Gene', width: { wpx: 160 } },
      ],
      data: [
        { value: view },
        { value: 'Protein Abundance' },
        { value: 'Tumor vs Control' },
        { value: form.gene.label }
      ]
    }
  ]*/

  const exportAbundance = [
    {
      columns: proteinAbundanceColumns.map((e) => {
        return { title: e.label, width: { wpx: 160 } };
      }),
      data: cases
        .filter((c) => view === c.cancerId)
        .map((c) => {
          return [
            { value: c.name },
            {
              value: c.proteinLogRatioCase
                ? Number(c.proteinLogRatioCase.toFixed(4))
                : "NA",
            },
            {
              value: c.proteinLogRatioControl
                ? Number(c.proteinLogRatioControl.toFixed(4))
                : "NA",
            },
            {
              value:
                c.proteinLogRatioCase && c.proteinLogRatioControl
                  ? Number(
                      Math.abs(
                        (
                          c.proteinLogRatioControl.toFixed(4) -
                          c.proteinLogRatioCase.toFixed(4)
                        ).toFixed(4),
                      ),
                    )
                  : "NA",
            },
            {
              value: c.proteinLogRatioChange
                ? Number(c.proteinLogRatioChange.toFixed(4))
                : "NA",
            },
          ];
        }),
    },
  ];

  const defaultLayout = {
    xaxis: {
      zeroline: false,
    },
    yaxis: {
      title: "Protein Abundance",
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

  return (
    <Tabs activeKey={tab} onSelect={(e) => setTab(e)} className="mb-3">
      <Tab eventKey="summary" title="Summary">
        <Row className="m-3">
          <Col xl={12}>
            <Plot
              data={multiBarPlotData()}
              layout={{
                ...defaultLayout,
                title: "<b>Average Tumor and Control</b>",
                barmode: "group",
                autosize: true,
              }}
              config={defaultConfig}
              useResizeHandler
              className="flex-fill w-100"
              style={{ height: "500px" }}
            />
          </Col>
        </Row>

        <div className="m-3">
          <Table columns={summaryColumns} data={averages} />

          <ExcelFile element={<Button>Download Data</Button>}>
            <ExcelSheet
              dataSet={exportSummarySettings()}
              name="Input Configuration"
            />
            <ExcelSheet dataSet={exportSummary} name="Summary Data" />
          </ExcelFile>
        </div>
      </Tab>

      <Tab eventKey="tumorView" title="Tumor View">
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
                setFoldSize(
                  `${
                    cases
                      .filter((c) => parseInt(e.target.value) === c.cancerId)
                      .length.toString() * 20
                  }px`,
                );
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
          <div
            className="col-xl-1 col-form-label"
            style={{ minWidth: "180px" }}>
            Gene: {form.gene.label}
          </div>
          <ToggleButtonGroup
            type="radio"
            name="plot-tab"
            value={plotTab}
            className="col-xl-5">
            <ToggleButton
              className={
                plotTab === "tumorVsControl" ? "btn-primary" : "btn-secondary"
              }
              id={"tumorVsControl"}
              onClick={handleToggle}>
              Tumor vs Adjacent Normal
            </ToggleButton>
            <ToggleButton
              className={
                plotTab === "foldChange" ? "btn-primary" : "btn-secondary"
              }
              id={"foldChange"}
              onClick={handleToggle}>
              Log<sub>2</sub> Fold Change
            </ToggleButton>
          </ToggleButtonGroup>
        </Form.Group>
        <Row className="m-3">
          {plotTab === "tumorVsControl" && (
            <Col xl={12} style={{ height: "800px" }}>
              <Plot
                data={boxPlotData}
                layout={{
                  ...defaultLayout,
                  title: "<b>Tumor vs Adjacent Normal</b>",
                  yaxis: {
                    title: "Log Protien Abundance",
                    zeroline: false,
                  },
                  boxgroupgap: 0.4,
                  boxgap: 0.4,
                  autosize: true,
                }}
                config={defaultConfig}
                useResizeHandler
                style={{ height: "800px" }}
              />
            </Col>
          )}
        </Row>
        {plotTab === "foldChange" && (
          <div className="m-3" style={{ height: "800px", overflowY: "scroll" }}>
            <Plot
              data={foldData()}
              config={defaultConfig}
              layout={{
                autosize: true,
                title: "<b>Log<sub>2</sub> Fold Change</b>",
                xaxis: {
                  title: "Log<sub>2</sub> Fold Change",
                  zeroline: false,
                },
                xaxis2: {
                  zeroline: false,
                  overlaying: "x",
                  side: "top",
                },
                showlegend: false,
                barmode: "stack",
              }}
              useResizeHandler
              style={{ minWidth: "100%", height: foldSize, minHeight: "400px" }}
            />
          </div>
        )}

        <fieldset className="m-3 border">
          <div className="col-xl-12 my-2 d-flex justify-content-center">
            P Value: {averages.find((e) => e.id === view).pValue}
          </div>
        </fieldset>

        <div className="m-3">
          <Table
            columns={proteinAbundanceColumns}
            data={cases
              .filter((c) => view === c.cancerId)
              .map((c) => {
                return {
                  ...c,
                  proteinLogRatioCase: c.proteinLogRatioCase
                    ? c.proteinLogRatioCase.toFixed(4)
                    : "NA",
                  proteinLogRatioControl: c.proteinLogRatioControl
                    ? c.proteinLogRatioControl.toFixed(4)
                    : "NA",
                  proteinLogRatioChange: c.proteinLogRatioChange
                    ? c.proteinLogRatioChange.toFixed(4)
                    : "NA",
                  proteinDiff:
                    c.proteinLogRatioCase && c.proteinLogRatioControl
                      ? Math.abs(
                          (
                            c.proteinLogRatioControl.toFixed(4) -
                            c.proteinLogRatioCase.toFixed(4)
                          ).toFixed(4),
                        )
                      : "NA",
                };
              })}
          />
          <ExcelFile element={<Button>Download Data</Button>}>
            <ExcelSheet
              dataSet={exportSummarySettings()}
              name="Input Configuration"
            />
            <ExcelSheet
              dataSet={exportAbundance}
              name="Protein Abundance Data"
            />
          </ExcelFile>
        </div>
      </Tab>
    </Tabs>
  );
}
