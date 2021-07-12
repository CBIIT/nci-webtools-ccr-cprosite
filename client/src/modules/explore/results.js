import { useRecoilValue } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Form from "react-bootstrap/Form";
import Table, { RangeFilter, TextFilter } from "../components/table";
import Plot from "react-plotly.js";
import { casesState, formState } from "./explore.state";
import { useState } from "react";

export default function Results() {
  const cases = useRecoilValue(casesState);
  const form = useRecoilValue(formState);
  const tumors = form.cancer.map((c) => c.value);
  const [view, setView] = useState(tumors[0]);
  const [tab, setTab] = useState("summary");

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

  const averages = form.cancer.map((c) => {
    const tumorFilter = cases
      .filter((d) => c.value === d.cancerId && d.proteinLogRatioCase !== null)
      .map((e) => Math.pow(2, e.proteinLogRatioCase));
    const controlFilter = cases
      .filter(
        (d) => c.value === d.cancerId && d.proteinLogRatioControl !== null,
      )
      .map((e) => Math.pow(2, e.proteinLogRatioControl));

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
      controlAverage: !isNaN(controlFilter[0])
        ? average(controlFilter).toFixed(4)
        : "NA",
      tumorAverage: !isNaN(tumorFilter[0])
        ? average(tumorFilter).toFixed(4)
        : "NA",
      controlNum: !isNaN(controlFilter[0]) ? controlFilter.length : 0,
      tumorNum: !isNaN(tumorFilter[0]) ? tumorFilter.length : 0,
      pValue: (Math.random() * Math.pow(1, -8)).toFixed(4),
    };
  });

  function multiBarPlotData() {
    return [
      {
        x: averages.map((c) => c.name),
        y: averages.map((c) => c.tumorAverage),
        type: "bar",
        name: "Tumor",
      },
      {
        x: averages.map((c) => c.name),
        y: averages.map((c) => c.controlAverage),
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

    return [
      {
        type: "bar",
        x: caseList.map((c) =>
          c.proteinLogRatioChange ? c.proteinLogRatioChange.toFixed(4) : null,
        ),
        y: caseList.map((c) => (c.proteinLogRatioChange ? c.name : null)),
        orientation: "h",
      },
    ];
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
        </Form.Group>
        <Row className="m-3">
          <Col xl={12}>
            <Plot
              data={boxPlotData}
              layout={{
                ...defaultLayout,
                title: "<b>Tumor vs Control</b>",
                yaxis: { title: "Log Protien Abundance", zeroline: false },
                autosize: true,
              }}
              config={defaultConfig}
              useResizeHandler
              style={{ height: "800px", minWidth: "100%" }}
            />
          </Col>
          {/*
          <Col xl={6}>
            <Plot
              data={barPlotData(averages.find(x => x.id === view))}
              layout={defaultLayout}
              config={defaultConfig}
              useResizeHandler
              className="w-100"
              style={{ height: "800px" }}
            />
          </Col>
          */}
        </Row>
        <div className="m-3">
          <Plot
            data={foldData()}
            config={defaultConfig}
            layout={{
              autosize: true,
              title: "<b>Log Fold Change</b>",
              xaxis: { title: "Log Fold Change", zeroline: false },
              barmode: "stack",
            }}
            useResizeHandler
            style={{ minWidth: "100%", minHeight: `1200px` }}
          />
        </div>

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
      </Tab>
    </Tabs>
  );
}
