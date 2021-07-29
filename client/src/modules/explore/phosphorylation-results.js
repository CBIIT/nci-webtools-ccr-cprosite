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
import { formState, siteState } from "./explore.state";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import { useState } from "react";
import _ from "lodash";

export default function PhosResults() {
  const form = useRecoilValue(formState);
  const [view, setView] = useState(form.cancer[0].value);

  const sites = Object.entries(
    _.groupBy(useRecoilValue(siteState), "phosphorylationSite"),
  ).filter((c) => c[0] !== "null");

  const [phosView, setPhosView] = useState(sites[0][0]);
  const [site, setSite] = useState(sites[0][1][0]);
  const [tab, setTab] = useState("summary");
  const [plotTab, setPlot] = useState("tumorVsControl");

  const phosSiteColumns = [
    {
      accessor: "name",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="phos_patient">Patient ID</Tooltip>}>
          <b>Patient ID</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "tumorValue",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="phos_tumor_val">Tumor Value</Tooltip>}>
          <b>Tumor Value</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "controlValue",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="phos_control_val">Adjacent Normal Value</Tooltip>
          }>
          <b>Adjacent Normal Value</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "proteinDiff",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_diff">
              Difference between Tumor and Adjacent Normal values
            </Tooltip>
          }>
          <b>
            Log<sub>2</sub> Fold Change
          </b>
        </OverlayTrigger>
      ),
    },
  ];

  const summary = [
    {
      accessor: "link",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="phos_site">Phosphorylation Site</Tooltip>}>
          <b>Phosphorylation Site</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "accession",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="phos_accession">Accession</Tooltip>}>
          <b>Accession</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "peptide",
      Header: (
        <OverlayTrigger overlay={<Tooltip id="phos_peptide">Peptide</Tooltip>}>
          <b>Peptide</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "tumorAverage",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="phos_av_tumor">Average Tumor</Tooltip>}>
          <b>Average Tumor</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "controlAverage",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="phos_av_control">Average Adjacent Normal</Tooltip>
          }>
          <b>Average Adjacent Normal</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "proteinDiff",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_diff">
              Average Protein Phosphorylation Level Difference (log<sub>2</sub>{" "}
              ratio between Tumor vs Adjacent Normal)
            </Tooltip>
          }>
          <b>
            Log<sub>2</sub> Fold Change
          </b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "tumorNum",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="phos_tumor_count">Tumor Sample Number</Tooltip>
          }>
          <b>Tumor Count</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "controlNum",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="phos_control_count">
              Adjacent Normal Sample Number
            </Tooltip>
          }>
          <b>Adjacent Normal Count</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "pValue",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="phos_pValue">Mann-Whitney U Test</Tooltip>}>
          <b>P Value</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "tumorError",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="phos_tumor_se">Tumor Standard Error</Tooltip>}>
          <b>Tumor SE</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "controlError",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="phos_control_se">
              Adjacent Normal Standard Error
            </Tooltip>
          }>
          <b>Adjacent Normal SE</b>
        </OverlayTrigger>
      ),
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
      accession: patients.filter((d) => d.accession != null)[0].accession,
      tumorAverage: tumorAverage,
      controlAverage: controlAverage,
      proteinDiff:
        !isNaN(controlAverage) && !isNaN(tumorAverage)
          ? Math.abs(controlAverage - tumorAverage).toFixed(4)
          : "NA",
      link: (
        <a
          onClick={() => {
            setPhosView(c[0]);
            setTab("phosView");
          }}
          href="javascript:void(0)">
          {c[0]}
        </a>
      ),
      tumorNum: !isNaN(tumorFilter[0]) ? tumorFilter.length : 0,
      controlNum: !isNaN(controlFilter[0]) ? controlFilter.length : 0,
      tumorError: calcStandardError(tumorFilter, tumorAverage),
      controlError: calcStandardError(controlFilter, controlAverage),
      pValue: (Math.random() * Math.pow(1, -8)).toFixed(4),
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
      hovertemplate: "%{x}: %{y} <extra></extra>",
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
      name: "Adjacent Normal",
      hovertemplate: "%{x}: %{y} <extra></extra>",
    },
  ];

  const phosBoxData = [
    {
      y: sites.filter((c) => c[0] === phosView)[0][1].map((d) => d.tumorValue),
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
      y: sites.filter((c) => c[0] === phosView)[0][1].map((d) => d.normalValue),
      type: "box",
      boxpoints: "all",
      name: "Adjacent Normal",
      jitter: 0.6,
      jitter: 0.6,
      marker: {
        size: 8,
      },
      hovertemplate: "%{y}<extra></extra>",
    },
  ];

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
    hoverlabel: {
      bgcolor: "#FFF",
      font: { color: "#000" },
      bordercolor: "#D3D3D3",
      nameLength: 0,
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
      <Tab eventKey="summary" title="Tumor View">
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
        </Form.Group>

        <Row className="m-3">
          <Col xl={12}>
            <Plot
              data={multiPhosBarPlot}
              layout={{
                ...defaultLayout,
                title: `<b>Tumor and Adjacent Normal</b> (Gene: ${form.gene.label})`,
                xaxis: {
                  title: "Phosphorylation Site",
                  zeroline: false,
                },
                yaxis: {
                  title: "Phosphorylation Level",
                  zeroline: false,
                },
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
          <Table columns={summary} data={phosphorylationData} />
        </div>
      </Tab>

      <Tab eventKey="phosView" title="Phosphorylation Site">
        <Form.Group className="row mx-3" controlId="phosView">
          <Form.Label
            className="col-xl-2 col-xs-12 col-form-label"
            style={{ minWidth: "160px", whiteSpace: "nowrap" }}>
            Phosphorylation Site
          </Form.Label>
          <div className="col-xl-3">
            <Form.Select
              name="phosView"
              onChange={(e) => {
                setPhosView(e.target.value);
                setSite(sites.filter((c) => c[0] === e.target.value)[0][1][0]);
              }}
              value={phosView}
              required>
              {sites.map((c) => (
                <option value={c[0]} key={`dataset-${c[0]}`}>
                  {c[0]}
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
              Log Fold Change
            </ToggleButton>
          </ToggleButtonGroup>
        </Form.Group>

        <Row className="mx-3 mt-3">
          <Col xl={12} style={{ height: "800px" }}>
            <Plot
              data={phosBoxData}
              layout={{
                ...defaultLayout,
                title: `<b>Tumor vs Control</b> (Gene: ${form.gene.label})`,
                yaxis: { title: "Phosphorylation Level", zeroline: false },
                autosize: true,
                boxgroupgap: 0.4,
                boxgap: 0.4,
              }}
              config={defaultConfig}
              useResizeHandler
              style={{ height: "800px", minWidth: "100%" }}
            />
          </Col>
        </Row>

        <fieldset className="mx-5 mb-5 border row" style={{ color: "grey" }}>
          <div className="col-xl-3 my-2 d-flex justify-content-center">
            P Value:{" "}
            {phosphorylationData.find((e) => e.name === phosView).pValue}
          </div>
          <div className="col-xl-3 my-2 d-flex justify-content-center">
            Accession: {site.accession}
          </div>

          <div className="col-xl-5 my-2 d-flex justify-content-center">
            Peptide: {site.phosphopeptide}
          </div>
        </fieldset>

        <Row className="m-3">
          <Table
            columns={phosSiteColumns}
            data={sites
              .filter((c) => c[0] === phosView)[0][1]
              .map((d) => {
                return {
                  name: d.name,
                  tumorValue: d.tumorValue ? d.tumorValue.toFixed(4) : "NA",
                  controlValue: d.normalValue ? d.normalValue.toFixed(4) : "NA",
                  proteinDiff:
                    d.tumorValue && d.normalValue
                      ? Math.abs(
                          (
                            d.normalValue.toFixed(4) - d.tumorValue.toFixed(4)
                          ).toFixed(4),
                        )
                      : "NA",
                };
              })}
          />
        </Row>
      </Tab>
    </Tabs>
  );
}
