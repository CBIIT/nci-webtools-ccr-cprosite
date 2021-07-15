import { useRecoilValue } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Form from "react-bootstrap/Form";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import ToggleButton from "react-bootstrap/esm/ToggleButton";
import Table, { RangeFilter, TextFilter } from "../components/table";
import Plot from "react-plotly.js";
import { casesState, formState, siteState } from "./explore.state";

import { useState } from "react";
import _ from "lodash";

export default function Results() {
  const cases = useRecoilValue(casesState);
  const form = useRecoilValue(formState);
  const dataset = form.dataset;
  const tumors = form.cancer.map((c) => c.value);

  const [view, setView] = useState(tumors[0]);
  const [tab, setTab] = useState("summary");
  const [plotTab, setPlot] = useState("tumorVsControl");

  const sites = Object.entries(
    _.groupBy(useRecoilValue(siteState), "phosphorylationSite"),
  ).filter((c) => c[0] !== "null");

  console.log(sites);

  const [phosView, setPhosView] = useState(sites[0][0]);

  const proteinAbundanceColumns = [
    {
      accessor: "name",
      Header: <b>Patient ID</b>,
    },
    {
      accessor: "proteinLogRatioCase",
      Header: <b>Tumor Value</b>,
    },
    {
      accessor: "proteinLogRatioControl",
      Header: <b>Control Value</b>,
    },
    {
      accessor: "proteinLogRatioChange",
      Header: <b>Log Fold Change Value</b>,
    },
  ];

  const phosSiteColumns = [
    {
      accessor: "name",
      Header: <b>Patient ID</b>,
    },
    {
      accessor: "tumorValue",
      Header: <b>Tumor Value</b>,
    },
    {
      accessor: "controlValue",
      Header: <b>Control Value</b>,
    },
  ];

  const phosSummaryColumns = [
    {
      accessor: "link",
      Header: <b>Phosphorylation Site</b>,
    },
    {
      accessor: "peptide",
      Header: <b>Peptide</b>,
    },
    {
      accessor: "tumorAverage",
      Header: <b>Average Tumor</b>,
    },
    {
      accessor: "controlAverage",
      Header: <b>Average Control</b>,
    },
    {
      accessor: "tumorNum",
      Header: <b>Tumor Count</b>,
    },
    {
      accessor: "controlNum",
      Header: <b>Control Count</b>,
    },
    {
      accessor: "tumorError",
      Header: (
        <div data-toggle="tooltip" title="Tumor Standard Error">
          <b>Tumor SE</b>
        </div>
      ),
    },
    {
      accessor: "normalError",
      Header: (
        <div data-toggle="tooltip" title="Control Standard Error">
          <b>Control SE</b>
        </div>
      ),
    },
  ];

  const summaryColumns = [
    {
      accessor: "link",
      Header: <b>Tumor Type</b>,
      sort: true,
    },
    {
      accessor: "tumorAverage",
      Header: <b>Average Tumor</b>,
    },
    {
      accessor: "controlAverage",
      Header: <b>Average Control</b>,
    },
    {
      accessor: "tumorNum",
      Header: <b>Tumor Count</b>,
    },
    {
      accessor: "controlNum",
      Header: <b>Control Count</b>,
    },
    {
      accessor: "pValue",
      Header: <b>P Value</b>,
    },
    {
      accessor: "tumorError",
      Header: (
        <div data-toggle="tooltip" title="Tumor Standard Error">
          <b>Tumor SE</b>
        </div>
      ),
    },
    {
      accessor: "controlError",
      Header: (
        <div data-toggle="tooltip" title="Control Standard Error">
          <b>Control SE</b>
        </div>
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
    },
    {
      y: cases
        .filter((c) => c.cancerId === view)
        .map((c) => c.proteinLogRatioControl),
      type: "box",
      boxpoints: "all",
      name: "Control",
    },
  ];

  const average = (values) =>
    values.filter((v) => v !== null).reduce((a, b) => a + b) / values.length;

  /*
  function barPlotData(tumor) {
    return ([
      {
        x: ["Control", "Case"],
        y: [
          tumor.controlAverage,
          tumor.caseAverage,
        ],
        type: "bar",
      },
    ])
  }*/

  function calcStandardError(values, average) {
    var result = 0;

    for (var i = 0; i < values.length; i++) {
      result += Math.pow(values[0] - average, 2);
    }

    result = result / values.length;
    result = Math.sqrt(result) / Math.sqrt(values.length);

    return !isNaN(result) ? result.toFixed(4) : "NA";
  }

  const phosphorylationData = sites.map((c) => {
    const patients = c[1];
    const tumorFilter = patients
      .filter((d) => d.tumorValue !== null)
      .map((e) => e.tumorValue);
    const controlFilter = patients
      .filter((d) => d.normalValue !== null)
      .map((e) => e.normalValue);
    const tumorAverage = !isNaN(tumorFilter[0])
      ? average(tumorFilter).toFixed(4)
      : "NA";
    const controlAverage = !isNaN(controlFilter[0])
      ? average(controlFilter).toFixed(4)
      : "NA";

    return {
      name: c[0],
      peptide: patients.filter((d) => d.phosphopeptide !== null)[0]
        .phosphopeptide,
      tumorAverage: tumorAverage,
      controlAverage: controlAverage,
      link: (
        <a
          onClick={() => {
            setPhosView(c[0]);
            setTab("tumorView");
          }}
          href="javascript:void(0)">
          {c[0]}
        </a>
      ),
      tumorNum: !isNaN(tumorFilter[0]) ? tumorFilter.length : 0,
      controlNum: !isNaN(controlFilter[0]) ? controlFilter.length : 0,
      tumorError: calcStandardError(tumorFilter, tumorAverage),
      controlError: calcStandardError(controlFilter, controlAverage),
    };
  });

  const phosBoxData = [
    {
      y: sites.filter((c) => c[0] === phosView)[0][1].map((d) => d.tumorValue),
      type: "box",
      boxpoints: "all",
      name: "Tumor",
    },
    {
      y: sites.filter((c) => c[0] === phosView)[0][1].map((d) => d.normalValue),
      type: "box",
      boxpoints: "all",
      name: "Control",
    },
  ];

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
      controlAverage: controlAverage,
      tumorAverage: tumorAverage,
      controlNum: !isNaN(controlFilter[0]) ? controlFilter.length : 0,
      tumorNum: !isNaN(tumorFilter[0]) ? tumorFilter.length : 0,
      pValue: (Math.random() * Math.pow(1, -8)).toFixed(4),
      tumorError: calcStandardError(
        cases
          .filter(
            (d) => c.value === d.cancerId && d.proteinLogRatioCase !== null,
          )
          .map((e) => e.proteinLogRatioCase),
        tumorAverage,
      ),
      controlError: calcStandardError(
        cases
          .filter(
            (d) => c.value === d.cancerId && d.proteinLogRatioControl !== null,
          )
          .map((e) => e.proteinLogRatioControl),
        controlAverage,
      ),
    };
  });

  const multiPhosBarPlot = [
    {
      x: phosphorylationData.map((c) => c.name),
      y: phosphorylationData.map((c) => c.tumorAverage),
      error_y: {
        type: "data",
        array: phosphorylationData.map((c) => c.tumorError),
        visible: true,
        color: "rgb(31,119,180)",
      },
      type: "bar",
      name: "Tumor",
    },
    {
      x: phosphorylationData.map((c) => c.name),
      y: phosphorylationData.map((c) => c.controlAverage),
      error_y: {
        type: "data",
        array: phosphorylationData.map((c) => c.controlError),
        visible: true,
        color: "rgb(255,127,14)",
      },
      type: "bar",
      name: "Control",
    },
  ];

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
        name: "Control",
      },
    ];
  }

  function foldData() {
    var caseList = cases
      .filter((c) => view === c.cancerId)
      .sort((a, b) =>
        a.proteinLogRatioChange > b.proteinLogRatioChange ? 1 : -1,
      );
    console.log(
      `${cases.filter((c) => view === c.cancerId).length.toString() * 60} px`,
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
    ];
  }

  function handleToggle(e) {
    setPlot(e.target.control.id);
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
        {dataset === "protein-abundance" && (
          <div>
            <Row className="m-3">
              <Col xl={12}>
                <Plot
                  data={multiBarPlotData()}
                  layout={{
                    ...defaultLayout,
                    title: "<b>Average Tumor and Control</b>",
                    barmode: "group",
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
            </div>
          </div>
        )}

        {dataset === "phosphorylation-site" && (
          <div>
            <Row className="m-3">
              <Col xl={12}>
                <Plot
                  data={multiPhosBarPlot}
                  layout={{
                    ...defaultLayout,
                    title: "<b>Average Tumor and Control</b>",
                    xaxis: {
                      title: "Phosphorylation Site",
                      zeroline: false,
                    },
                    yaxis: {
                      title: "Phosphorylation Level",
                      zeroline: false,
                    },
                    barmode: "group",
                  }}
                  config={defaultConfig}
                  useResizeHandler
                  className="flex-fill w-100"
                  style={{ height: "500px" }}
                />
              </Col>
            </Row>

            <div className="m-3">
              <Table columns={phosSummaryColumns} data={phosphorylationData} />
            </div>
          </div>
        )}
      </Tab>

      <Tab eventKey="tumorView" title="Tumor View">
        {dataset === "protein-abundance" && (
          <div>
            <Form.Group className="row mx-3" controlId="tumorView">
              <Form.Label
                className="col-xl-1 col-xs-12 col-form-label"
                style={{ minWidth: "120px" }}>
                Tumor Type
              </Form.Label>
              <div className="col-xl-3">
                <Form.Select
                  name="caseView"
                  onChange={(e) => setView(parseInt(e.target.value))}
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
                className="col-xl-5">
                <ToggleButton
                  className={
                    plotTab === "tumorVsControl"
                      ? "btn-primary"
                      : "btn-secondary"
                  }
                  id={"tumorVsControl"}
                  onClick={handleToggle}>
                  Tumor vs Control
                </ToggleButton>
                <ToggleButton
                  className={
                    plotTab === "foldChange" ? "btn-primary" : "btn-secondary"
                  }
                  id={"foldChange"}
                  onClick={handleToggle}>
                  Log Fold Change
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
                      title: "<b>Tumor vs Control</b>",
                      yaxis: {
                        title: "Log Protien Abundance",
                        zeroline: false,
                      },
                      autosize: true,
                    }}
                    config={defaultConfig}
                    useResizeHandler
                    style={{ height: "800px", minWidth: "100%" }}
                  />
                </Col>
              )}
            </Row>
            {plotTab === "foldChange" && (
              <div
                className="m-3"
                style={{ height: "800px", overflowY: "scroll" }}>
                <Plot
                  data={foldData()}
                  config={defaultConfig}
                  layout={{
                    autosize: true,
                    title: "<b>Log Fold Change</b>",
                    xaxis: {
                      title: "Log<sub>2</sub> Fold Change",
                      zeroline: false,
                    },
                    barmode: "stack",
                  }}
                  useResizeHandler
                  style={{ minWidth: "100%", height: `1200px` }}
                />
              </div>
            )}

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
                    };
                  })}
              />
            </div>
          </div>
        )}

        {dataset === "phosphorylation-site" && (
          <div>
            <Form.Group className="row mx-3" controlId="phosView">
              <Form.Label
                className="col-xl-2 col-xs-12 col-form-label"
                style={{ minWidth: "120px" }}>
                Phosphorylation Site
              </Form.Label>
              <div className="col-xl-3">
                <Form.Select
                  name="phosView"
                  onChange={(e) => setPhosView(e.target.value)}
                  value={phosView}
                  required>
                  {sites.map((c) => (
                    <option value={c[0]} key={`dataset-${c[0]}`}>
                      {c[0]}
                    </option>
                  ))}
                </Form.Select>
              </div>

              {/*<ToggleButtonGroup
                type="radio"
                name="plot-tab"
                value={plotTab}
                className="col-xl-5">
                <ToggleButton
                  className={
                    plotTab === "tumorVsControl"
                      ? "btn-primary"
                      : "btn-secondary"
                  }
                  id={"tumorVsControl"}
                  onClick={handleToggle}>
                  Tumor vs Control
                </ToggleButton>
                <ToggleButton
                  className={
                    plotTab === "foldChange" ? "btn-primary" : "btn-secondary"
                  }
                  id={"foldChange"}
                  onClick={handleToggle}>
                  Log Fold Change
                </ToggleButton>
                </ToggleButtonGroup>*/}
            </Form.Group>

            <Row className="m-3">
              <Col xl={12} style={{ height: "800px" }}>
                <Plot
                  data={phosBoxData}
                  layout={{
                    ...defaultLayout,
                    title: "<b>Tumor vs Control</b>",
                    yaxis: { title: "Phosphorylation Level", zeroline: false },
                    autosize: true,
                  }}
                  config={defaultConfig}
                  useResizeHandler
                  style={{ height: "800px", minWidth: "100%" }}
                />
              </Col>
            </Row>
            <Row className="m-3">
              <Table
                columns={phosSiteColumns}
                data={sites
                  .filter((c) => c[0] === phosView)[0][1]
                  .map((d) => {
                    return {
                      name: d.name,
                      tumorValue: d.tumorValue ? d.tumorValue.toFixed(4) : "NA",
                      controlValue: d.normalValue
                        ? d.normalValue.toFixed(4)
                        : "NA",
                    };
                  })}
              />
            </Row>
          </div>
        )}
      </Tab>
    </Tabs>
  );
}
