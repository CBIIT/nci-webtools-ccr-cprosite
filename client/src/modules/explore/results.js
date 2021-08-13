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
import ReactExport from "react-data-export";
import React, { useState } from "react";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.Excelsheet;

export default function Results() {
  const form = useRecoilValue(formState);
  const tumors = form.cancer.map((c) => c.value);
  const results = useRecoilValue(resultsState);

  const [view, setView] = useState(tumors[0]);
  const [tab, setTab] = useState("summary");
  const [plotTab, setPlot] = useState("tumorVsControl");

  const proteinAbundanceColumns = [
    {
      accessor: "name",
      id: "name",
      label: "Patient ID",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="protein_patient">Patient ID</Tooltip>}>
          <b>Patient ID</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "tumorValue",
      label: "Tumor Abundance",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="protein_tumor_val">Tumor Abundance</Tooltip>}>
          <b>Tumor Abundance</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "normalValue",
      label: "Adjacent Normal Abundance",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_normal_val">Adjacent Normal Abundance</Tooltip>
          }>
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
              Average Protein Abundance Difference (log<sub>2</sub> ratio
              between Tumor vs Adjacent Normal)
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
          <b>Avg. Tumor</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "controlAverage",
      label: "Average Adjacent Normal",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_av_normal">Average Adjacent Normal</Tooltip>
          }>
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
              Average Protein Abundance Difference (log<sub>2</sub> ratio
              between Tumor vs Adjacent Normal)
            </Tooltip>
          }>
          <b>Tumor vs Adj. Normal</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "pValuePaired",
      label: "P Value (Paired)",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_pvalue">Mann-Whitney U Test (Paired)</Tooltip>
          }>
          <b>P Value (Paired)</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "pValueUnpaired",
      label: "P Value (Unpaired)",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_pvalue">
              Mann-Whitney U Test (Unpaired)
            </Tooltip>
          }>
          <b>P Value (Unpaired)</b>
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
      label: "Adjacent Normal Count",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_normal_count">
              Adjacent Normal Sample Number
            </Tooltip>
          }>
          <b>Adj. Normal Count</b>
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
      label: "Adjacent Normal SE",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_control_se">
              Adjacent Normal Stanadard Error
            </Tooltip>
          }>
          <b>Adj. Normal SE</b>
        </OverlayTrigger>
      ),
    },
  ];

  const boxPlotData = [
    {
      y: results
        .find((e) => e.cancer.value === view)
        .participants.records.map((e) => e.tumorValue),
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
      y: results
        .find((e) => e.cancer.value === view)
        .participants.records.map((e) => e.normalValue),
      type: "box",
      boxpoints: "all",
      name: "Adjacent Normal",
      jitter: 0.6,
      marker: {
        size: 8,
      },
      hovertemplate: "%{y}<extra></extra>",
    },
  ];

  const averages = results.map((e) => {
    const summary = e.summary.records[0];

    return {
      id: e.cancer.value,
      name: e.cancer.label,
      link: (
        <a
          onClick={() => {
            setView(e.cancer.value);
            setTab("tumorView");
          }}
          href="javascript:void(0)">
          {e.cancer.label}
        </a>
      ),
      controlAverage:
        summary && summary.normalSampleMean !== null
          ? Number(summary.normalSampleMean.toFixed(4))
          : "NA",
      tumorAverage:
        summary && summary.tumorSampleMean !== null
          ? Number(summary.tumorSampleMean.toFixed(4))
          : "NA",
      proteinDiff:
        summary &&
        summary.normalSampleMean !== null &&
        summary.tumorSampleMean !== null
          ? Number(
              (summary.tumorSampleMean - summary.normalSampleMean).toFixed(4),
            )
          : "NA",
      controlNum:
        summary && summary.normalSampleCount !== null
          ? summary.normalSampleCount
          : "NA",
      tumorNum:
        summary && summary.tumorSampleCount !== null
          ? summary.tumorSampleCount
          : "NA",
      pValuePaired:
        summary && summary.pValuePaired !== null
          ? Number(summary.pValuePaired.toFixed(4))
          : "NA",
      pValueUnpaired:
        summary && summary.pValueUnpaired !== null
          ? Number(summary.pValueUnpaired.toFixed(4))
          : "NA",
      controlError:
        summary && summary.normalSampleStandardError !== null
          ? Number(summary.normalSampleStandardError.toFixed(4))
          : "NA",
      tumorError:
        summary && summary.tumorSampleStandardError !== null
          ? Number(summary.tumorSampleStandardError.toFixed(4))
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
        name: "Adjacent Normal",
        hovertemplate: "%{x}: %{y} <extra></extra>",
      },
    ];
  }

  function foldData() {
    var caseList = results
      .find((e) => e.cancer.value === view)
      .participants.records.filter((e) => e.tumorValue && e.normalValue)
      .sort((a, b) => {
        const aFoldChange = a.tumorValue - a.normalValue;
        const bFoldChange = b.tumorValue - b.normalValue;

        return aFoldChange > bFoldChange ? 1 : -1;
      });

    const values = caseList.map((c) =>
      Number(
        (
          Number(c.tumorValue.toFixed(4)) - Number(c.normalValue.toFixed(4))
        ).toFixed(4),
      ),
    );

    return [
      {
        type: "bar",
        x: values,
        y: caseList.map((c) => c.participantId),
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
        y: caseList.map((c) => c.participantId),
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
          { title: "Dataset", width: { wpx: 160 } },
          { title: "Analysis", width: { wpx: 160 } },
          { title: "Gene", width: { wpx: 160 } },
        ],
        data: settings,
      },
    ];
  }

  function exportSummary() {
    return [
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
            { value: e.pValuePaired },
            { value: e.pValueUnpaired },
            { value: e.tumorNum },
            { value: e.controlNum },
            { value: e.tumorError },
            { value: e.controlError },
          ];
        }),
      },
    ];
  }

  function noData(tumors) {
    for (const tumor of tumors) {
      if (tumor.participants.records.length > 0) return false;
    }

    return true;
  }

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
          { value: form.cancer.filter((e) => e.value === view)[0].label },
          { value: "Protein Abundance" },
          { value: "Tumor vs Control" },
          { value: form.gene.label },
        ],
      ],
    },
  ];

  const exportAbundance = [
    {
      columns: proteinAbundanceColumns.map((e) => {
        return { title: e.label, width: { wpx: 160 } };
      }),
      data: results
        .find((e) => e.cancer.value === view)
        .participants.records.map((c) => {
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
                  ? Number(
                      Number(c.tumorValue.toFixed(4)) -
                        Number(c.normalValue.toFixed(4)).toFixed(4),
                    )
                  : "NA",
            },
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
    legend: {},
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
                title: `<b>Average Tumor and Adjacent Normal</b> (Gene: ${form.gene.label})`,
                barmode: "group",
                autosize: true,
                legend: {
                  orientation: "h",
                  y: -0.25,
                  x: 0.37,
                },
                annotations: [
                  {
                    text: noData(results) ? "No data available" : "",
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

        <div className="m-3">
          <div className="d-flex" style={{ justifyContent: "flex-end" }}>
            <ExcelFile
              filename={`CPROSITE-ProteinAbundance-TumorVsNormal-Summary-${getTimestamp()}`}
              element={<a href="javascript:void(0)">Export Data</a>}>
              <ExcelSheet
                dataSet={exportSummarySettings()}
                name="Input Configuration"
              />
              <ExcelSheet dataSet={exportSummary()} name="Summary Data" />
            </ExcelFile>
          </div>

          <Table
            columns={summaryColumns}
            data={averages}
            defaultSort={[{ id: "link", asec: true }]}
          />
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
          <ToggleButtonGroup
            type="radio"
            name="plot-tab"
            value={plotTab}
            className="col-xl-6"
            style={{ whiteSpace: "nowrap" }}>
            <ToggleButton
              className={
                plotTab === "tumorVsControl" ? "btn-primary" : "btn-secondary"
              }
              id={"tumorVsControl"}
              onClick={handleToggle}>
              Tumor vs Adj. Normal
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
        <Row className="mx-3 mt-3">
          {plotTab === "tumorVsControl" && (
            <Col xl={12} style={{ height: "800px" }}>
              <Plot
                data={boxPlotData}
                layout={{
                  ...defaultLayout,
                  title: `<b>Tumor vs Adjacent Normal</b> (Gene: ${
                    form.gene.label
                  }/P-Value: ${
                    averages.find((e) => e.id === view).pValuePaired
                  })`,
                  yaxis: {
                    title: "Log Protien Abundance",
                    zeroline: false,
                  },
                  boxgroupgap: 0.4,
                  boxgap: 0.4,
                  autosize: true,
                  legend: {
                    orientation: "h",
                    y: -0.1,
                    x: 0.37,
                  },
                  annotations: [
                    {
                      text: noData([
                        results.find((e) => e.cancer.value === view),
                      ])
                        ? "No data available"
                        : "",
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
                style={{ height: "800px" }}
              />
            </Col>
          )}

          {plotTab === "foldChange" && (
            <Col xl={12} style={{ height: "800px", overflowY: "scroll" }}>
              <Plot
                data={foldData()}
                config={defaultConfig}
                layout={{
                  autosize: true,
                  title: `<b>Log<sub>2</sub> Fold Change</b> (Gene: ${
                    form.gene.label
                  }/P-Value: ${
                    averages.find((e) => e.id === view).pValuePaired
                  })`,
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
                  annotations: [
                    {
                      text: noData([
                        results.find((e) => e.cancer.value === view),
                      ])
                        ? "No data available"
                        : "",
                      xref: "paper",
                      yref: "paper",
                      showarrow: false,
                      font: {
                        size: 28,
                      },
                    },
                  ],
                }}
                useResizeHandler
                style={{
                  minWidth: "100%",
                  height: `${foldData()[0].x.length * 20}px`,
                  minHeight: "500px",
                }}
              />
            </Col>
          )}
        </Row>

        <div className="m-3">
          <div className="d-flex" style={{ justifyContent: "flex-end" }}>
            <ExcelFile
              filename={`CPROSITE-ProteinAbundance-TumorVsNormal-Tumor-${getTimestamp()}`}
              element={<a href="javascript:void(0)">Export Data</a>}>
              <ExcelSheet
                dataSet={exportAbundanceSettings}
                name="Input Configuration"
              />
              <ExcelSheet
                dataSet={exportAbundance}
                name="Protein Abundance Data"
              />
            </ExcelFile>
          </div>
        </div>
        <Table
          columns={proteinAbundanceColumns}
          defaultSort={[{ id: "name", asec: true }]}
          data={results
            .find((e) => e.cancer.value === view)
            .participants.records.map((c) => {
              return {
                name: c.participantId,
                tumorValue: c.tumorValue
                  ? Number(c.tumorValue.toFixed(4))
                  : "NA",
                normalValue: c.normalValue
                  ? Number(c.normalValue.toFixed(4))
                  : "NA",
                proteinDiff:
                  c.tumorValue && c.normalValue
                    ? Number(
                        (
                          Number(c.tumorValue.toFixed(4)) -
                          Number(c.normalValue.toFixed(4))
                        ).toFixed(4),
                      )
                    : "NA",
              };
            })}
        />
      </Tab>
    </Tabs>
  );
}
