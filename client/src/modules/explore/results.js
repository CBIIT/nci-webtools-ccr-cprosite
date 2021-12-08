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
import _ from "lodash";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.Excelsheet;

export default function Results() {
  const form = useRecoilValue(formState);
  const getResults = useRecoilValue(resultsState);
  const tumors = form.cancer.map((c) => c.value);

  const [tab, setTab] = useState("summary");
  const [plotTab, setPlot] = useState("tumorVsControl");

  const results = Object.entries(
    _.groupBy(useRecoilValue(resultsState)[0].participants.records, "cancerId"),
  ).filter((e) => e[0] !== "null");

  console.log(results);
  const [view, setView] = useState(results.length ? Number(results[0][0]) : 0);
  const currentTumor = form.cancer.find((e) => e.value === view)
    ? view
    : form.cancer[0].value;

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
  ];

  const boxPlotData = [
    {
      y: results.length
        ? results
            .find(
              (e) =>
                Number(e[0]) ===
                (form.cancer.find((e) => e.value === view)
                  ? view
                  : form.cancer[0].value),
            )[1]
            .map((e) => e.tumorValue)
        : [],
      type: "box",
      boxpoints: "all",
      name: "<b>Tumor</b>",
      jitter: 0.6,
      marker: {
        size: 10,
        color: "rgb(255,0,0)",
      },
      hovertemplate: "Tumor Abundance: %{y}<extra></extra>",
    },
    {
      y: results.length
        ? results
            .find(
              (e) =>
                Number(e[0]) ===
                (form.cancer.find((e) => e.value === view)
                  ? view
                  : form.cancer[0].value),
            )[1]
            .map((e) => e.normalValue)
        : [],
      type: "box",
      boxpoints: "all",
      name: "<b>Adjacent Normal</b>",
      jitter: 0.6,
      marker: {
        size: 10,
        color: "rgb(31,119,180)",
      },
      hovertemplate: "Adj. Normal Abundance: %{y}<extra></extra>",
    },
  ];

  const averages = getResults[0].summary.records.map((e) => {
    return {
      id: e.cancerId,
      name: form.cancer.find((f) => f.value === e.cancerId).label,
      link: (
        <a
          onClick={() => {
            setView(e.cancerId);
            setTab("tumorView");
          }}
          href="javascript:void(0)">
          {form.cancer.find((f) => f.value === e.cancerId).label}
        </a>
      ),
      controlAverage:
        e.normalSampleMean !== null
          ? Number(e.normalSampleMean.toFixed(4))
          : "NA",
      tumorAverage:
        e.tumorSampleMean !== null
          ? Number(e.tumorSampleMean.toFixed(4))
          : "NA",
      proteinDiff:
        e.normalSampleMean !== null && e.tumorSampleMean !== null
          ? Number((e.tumorSampleMean - e.normalSampleMean).toFixed(4))
          : "NA",
      controlNum: e.normalSampleCount !== null ? e.normalSampleCount : "NA",
      tumorNum: e.tumorSampleCount !== null ? e.tumorSampleCount : "NA",
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
      controlError:
        e.normalSampleStandardError !== null
          ? Number(e.normalSampleStandardError.toFixed(4))
          : "NA",
      tumorError:
        e.tumorSampleStandardError !== null
          ? Number(e.tumorSampleStandardError.toFixed(4))
          : "NA",
    };
  });

  console.log(averages);

  function multiBarPlotData() {
    return [
      {
        x: averages.map((c) => c.name),
        y: averages.map((c) => c.tumorAverage),
        error_y: {
          type: "data",
          array: averages.map((c) => c.tumorError),
          visible: true,
          color: "rgb(255,0,0)",
        },
        marker: {
          color: "rgb(255,0,0)",
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
          color: "rgb(31,119,180)",
        },
        marker: {
          color: "rgb(31,119,180)",
        },
        type: "bar",
        name: "Adjacent Normal",
        hovertemplate: "%{x}: %{y} <extra></extra>",
      },
    ];
  }

  function foldData() {
    if (results.length !== 0) {
      var caseList = results
        .find(
          (e) =>
            Number(e[0]) ===
            (form.cancer.find((e) => e.value === view)
              ? view
              : form.cancer[0].value),
        )[1]
        .filter((e) => e.tumorValue !== null && e.normalValue !== null)
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
          hovertemplate:
            "Patient ID: %{y}<br>Log Fold Change: %{x}<extra></extra>",
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
          hovertemplate:
            "Patient ID: %{y}<br>Log Fold Change: %{x}<extra></extra>",
        },
      ];
    }

    return [];
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
            value: form.cancer.find((e) => e.value === view)
              ? form.cancer.find((e) => e.value === view).label
              : "NA",
          },
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
      data:
        results.length &&
        results.find((e) => Number(e[0]) === view) &&
        results
          .find((e) => Number(e[0]) === view)[1]
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

  const defaultLayout = {
    yaxis: {
      title: "<b>Relative Protein Abundance (TMT log2 vlaue)</b>",
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
                title: `<b>${form.gene.label} Protein Abundance Tumor vs Adjacent Normal</b>`,
                barmode: "group",
                autosize: true,
                xaxis: {
                  title: "<b>Tumor Type </b>",
                  zeroline: false,
                  titlefont: {
                    size: 16,
                  },
                  tickfont: {
                    size: 15,
                  },
                },
                legend: {
                  orientation: "h",
                  y: -0.5,
                  x: 0.41,
                  font: { size: 16 },
                },
                annotations: [
                  {
                    text: results.length === 0 ? "No data available" : "",
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
                  filename: `Protein_Abundance_Tumor_vs_Adjacent_Normal-${form.gene.label}`,
                },
              }}
              useResizeHandler
              className="flex-fill w-100"
              style={{ height: "500px" }}
            />
          </Col>
        </Row>

        <div className="m-3">
          <div className="d-flex" style={{ justifyContent: "flex-end" }}>
            <ExcelFile
              filename={`Protein_Abundance_Tumor_vs_Adjacent_Normal-${form.gene.label}`}
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
              {results.map((o) => (
                <option value={Number(o[0])} key={`dataset-${o[0]}`}>
                  {form.cancer.find((f) => f.value === Number(o[0])).label}
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
                  title: `<b>${form.gene.label} ${
                    form.cancer.find((f) => f.value === currentTumor).label
                  } Protein Abundance Tumor vs Adjacent Normal</b><br>(Unpaired P-Value: ${
                    averages.length && averages.find((e) => e.id === view)
                      ? averages.find((e) => e.id === view).pValueUnpaired
                      : "NA"
                  })`,

                  yaxis: {
                    title: "<b>Relative Protein Abundance (TMT log2 vlaue)</b>",
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
                        results.filter((f) => Number(f[0]) === currentTumor)
                          .length === 0
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
                    filename: `${
                      form.cancer.find((f) => f.value === currentTumor).label
                    }_Protein_Abundance_Tumor_vs_Adjacent_Normal-${
                      form.gene.label
                    }`,
                  },
                }}
                useResizeHandler
                style={{ height: "800px" }}
              />
            </Col>
          )}

          {plotTab === "foldChange" && (
            <Col xl={12} style={{ height: "800px", overflowY: "scroll" }}>
              <Plot
                data={foldData()}
                config={{
                  ...defaultConfig,
                  toImageButtonOptions: {
                    ...defaultConfig.toImageButtonOptions,
                    filename: `${
                      form.cancer.find((f) => f.value === currentTumor).label
                    }_Protein_Abundance_Tumor_vs_Adjacent_Normal_Log_Fold_Change-${
                      form.gene.label
                    }`,
                  },
                }}
                layout={{
                  autosize: true,
                  title: `<b>${form.gene.label} ${
                    form.cancer.find((f) => f.value === currentTumor).label
                  } Log<sub>2</sub> Fold Change</b><br>(Paired P-Value: ${
                    averages.length && averages.find((e) => e.id === view)
                      ? averages.find((e) => e.id === view).pValuePaired
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
                        results.filter((f) =>
                          Number(f[0]) ===
                          form.cancer.find((e) => e.value === view)
                            ? view
                            : form.cancer[0].value,
                        ).length === 0
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
                  height: foldData().length
                    ? `${foldData()[0].x.length * 25}px`
                    : "700px",
                  minHeight: "700px",
                }}
              />
            </Col>
          )}
        </Row>

        <div className="m-3">
          <div className="d-flex" style={{ justifyContent: "flex-end" }}>
            <ExcelFile
              filename={`${
                form.cancer.find((f) => f.value === currentTumor).label
              }_Protein_Abundance_Tumor_vs_Adjacent_Normal-${form.gene.label}`}
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

          <Table
            columns={proteinAbundanceColumns}
            defaultSort={[{ id: "name", asec: true }]}
            data={
              results.find((f) => Number(f[0]) === currentTumor)
                ? results
                    .find((e) => Number(e[0]) === currentTumor)[1]
                    .map((c) => {
                      return {
                        name: c.participantId,
                        tumorValue:
                          c.tumorValue !== null
                            ? Number(c.tumorValue.toFixed(4))
                            : "NA",
                        normalValue:
                          c.normalValue !== null
                            ? Number(c.normalValue.toFixed(4))
                            : "NA",
                        proteinDiff:
                          c.tumorValue !== null && c.normalValue !== null
                            ? Number(
                                (
                                  Number(c.tumorValue.toFixed(4)) -
                                  Number(c.normalValue.toFixed(4))
                                ).toFixed(4),
                              )
                            : "NA",
                      };
                    })
                : []
            }
          />
        </div>
      </Tab>
    </Tabs>
  );
}
