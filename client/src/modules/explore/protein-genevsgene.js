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
import Select from "react-select";

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
  const [view, setView] = useState(form.cancer.map((e) => e.value));
  const [siteTumor, setSiteTumor] = useState({
    value: form.cancer[0].value,
    label: form.cancer[0].label,
  });
  const [label, setLabel] = useState("");
  const [tab, setTab] = useState("summaryView");

  console.log(results);
  var firstGeneSet = results[0].participants.records.filter((e) =>
    view.includes(e.cancerId),
  );

  var secondGeneSet = results[1].participants.records.filter((e) =>
    view.includes(e.cancerId),
  );

  const [numType, setNumType] = useState("log2");

  const [firstSite, setFirstSite] = useState("");
  const [secondSite, setSecondSite] = useState("");
  var firstSites = Object.entries(
    _.groupBy(
      results[0].participants.records.filter(
        (f) => f.cancerId === siteTumor.value,
      ),
      "phosphorylationSite",
    ),
  ).filter((e) => e[0] !== "null");

  var secondSites = Object.entries(
    _.groupBy(
      results[1].participants.records.filter(
        (f) => f.cancerId === siteTumor.value,
      ),
      "phosphorylationSite",
    ),
  ).filter((e) => e[0] !== "null");

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
            <Tooltip id="second_tumor_num">
              {secondGene} Tumor Abundance
            </Tooltip>
          }>
          <b>{secondGene} Tumor Abundance</b>
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

  const siteColumns = [
    {
      accessor: "phosphorylationSite",
      id: "phosphorylationSite",
      label: "Phosphorylation Site",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="site_correlation_phospho">
              Phosphorylation Site
            </Tooltip>
          }>
          <b>Phospho. Site</b>
        </OverlayTrigger>
      ),
      sort: true,
      sortType: (a, b) =>
        a.original.phosphorylationSite.key > b.original.phosphorylationSite.key
          ? 1
          : -1,
    },
    {
      accessor: "accession",
      label: "Accession",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="site_correlation_accession">Accession</Tooltip>
          }>
          <b>Accession</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "phosphopeptide",
      label: "Phosphopeptide",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="site_correlation_peptide">Phosphopeptide</Tooltip>
          }>
          <b>Peptide</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "tumorSampleCount",
      label: "Tumor Count",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="site_correlation_peptide">Tumor Sample Number</Tooltip>
          }>
          <b>Tumor Count</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "normalSampleCount",
      label: "Adjacent Normal Count",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="site_correlation_peptide">
              Adjacent Normal Sample Number
            </Tooltip>
          }>
          <b>Adj. Normal Count</b>
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
        firstTumor:
          first.tumorValue !== null
            ? Number(first.tumorValue.toFixed(4))
            : null,
        firstTumorNum:
          first.tumorValue !== null
            ? Number(Math.pow(2, first.tumorValue).toFixed(4))
            : null,
        firstControl:
          first.normalValue !== null
            ? Number(first.normalValue.toFixed(4))
            : null,
        firstControlNum:
          first.normalValue !== null
            ? Number(Math.pow(2, first.normalValue).toFixed(4))
            : null,
        secondTumor:
          second.tumorValue !== null
            ? Number(second.tumorValue.toFixed(4))
            : null,
        secondTumorNum:
          second.tumorValue !== null
            ? Number(Math.pow(2, second.tumorValue).toFixed(4))
            : null,
        secondControl:
          second.normalValue !== null
            ? Number(second.normalValue.toFixed(4))
            : null,
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

  function getSite() {
    const firstFiltered = firstGeneSet.filter(
      (f) =>
        f.cancerId === siteTumor.value && f.phosphorylationSite === firstSite,
    );
    const secondFiltered = secondGeneSet.filter(
      (f) =>
        f.cancerId === siteTumor.value && f.phosphorylationSite === secondSite,
    );

    return firstFiltered.map((first) => {
      const second = secondFiltered.find((d) => {
        return first.participantId === d.participantId;
      });

      if (second) {
        return {
          name: first.participantId,
          firstTumor:
            first.tumorValue !== null
              ? Number(first.tumorValue.toFixed(4))
              : null,
          firstTumorNum:
            first.tumorValue !== null
              ? Number(Math.pow(2, first.tumorValue).toFixed(4))
              : null,
          firstControl:
            first.normalValue !== null
              ? Number(first.normalValue.toFixed(4))
              : null,
          firstControlNum:
            first.normalValue !== null
              ? Number(Math.pow(2, first.normalValue).toFixed(4))
              : null,
          secondTumor:
            second.tumorValue !== null
              ? Number(second.tumorValue.toFixed(4))
              : null,
          secondTumorNum:
            second.tumorValue !== null
              ? Number(Math.pow(2, second.tumorValue).toFixed(4))
              : null,
          secondControl:
            second.normalValue !== null
              ? Number(second.normalValue.toFixed(4))
              : null,
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
  }

  const siteData =
    form.dataset.value === "phosphoproteinData" ||
    form.dataset.value === "phosphoproteinRatioData"
      ? getSite().filter(
          (e) =>
            e.firstTumor && e.firstControl && e.secondTumor && e.secondControl,
        )
      : [];

  console.log(siteData);

  const defaultLayout = {
    xaxis: {
      title: `<b>${firstGene}</b>`,
      zeroline: false,
      titlefont: {
        size: 15,
      },
    },
    yaxis: {
      title: `<b>${secondGene}</b>`,
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
      marker: {
        size: 8,
      },
      mode: "markers",
      type: "scatter",
      name: "Tumor",
      hovertemplate:
        `${firstGene} Tumor ${
          numType === "log2" ? "Log2" : "Abundance"
        }: %{x}<br>` +
        `${secondGene} Tumor ${
          numType === "log2" ? "Log2" : "Abundance"
        }: %{y})<extra></extra>`,
    },
    {
      x: proteinGene.map((e) =>
        numType === "log2" ? e.firstControl : e.firstControlNum,
      ),
      y: proteinGene.map((e) =>
        numType === "log2" ? e.secondControl : e.secondControlNum,
      ),
      marker: {
        size: 8,
      },
      mode: "markers",
      type: "scatter",
      name: "Adjacent Normal",
      hovertemplate:
        `${firstGene} Control ${
          numType === "log2" ? "Log2" : "Abundance"
        }: %{x}<br>` +
        `${secondGene} Control ${
          numType === "log2" ? "Log2" : "Abundance"
        }: %{y}<extra></extra>`,
    },
  ];

  const siteScatter = [
    {
      x: siteData.map((e) =>
        numType === "log2" ? e.firstTumor : e.firstTumorNum,
      ),
      y: siteData.map((e) =>
        numType === "log2" ? e.secondTumor : e.secondTumorNum,
      ),
      marker: {
        size: 8,
      },
      mode: "markers",
      type: "scatter",
      name: "Tumor",
      hovertemplate:
        `${firstGene} Tumor ${
          numType === "log2" ? "Log2" : "Abundance"
        }: %{x}<br>` +
        `${secondGene} Tumor ${
          numType === "log2" ? "Log2" : "Abundance"
        }: %{y}<extra></extra>`,
    },
    {
      x: siteData.map((e) =>
        numType === "log2" ? e.firstControl : e.firstControlNum,
      ),
      y: siteData.map((e) =>
        numType === "log2" ? e.secondControl : e.secondControlNum,
      ),
      marker: {
        size: 8,
      },
      mode: "markers",
      type: "scatter",
      name: "Adjacent Normal",
      hovertemplate:
        `${firstGene} Control ${
          numType === "log2" ? "Log2" : "Abundance"
        }: %{x}<br>` +
        `${secondGene} Control ${
          numType === "log2" ? "Log2" : "Abundance"
        }: %{y}<extra></extra>`,
    },
  ];

  function exportSummarySettings() {
    var settings = form.cancer
      .filter((f) => view.find((c) => c === f.value))
      .map((e) => {
        return [{ value: e.label }];
      });
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

  function exportSiteSettings(gene) {
    var settings = form.cancer
      .filter((f) => view.find((c) => c === f.value))
      .map((e) => {
        return [{ value: e.label }];
      });
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
        ],
        data: [
          { value: form.cancer.find((f) => f.value === siteTumor.value).label },
          { value: form.dataset.label },
          { value: "Correlation" },
          { value: gene },
        ],
      },
    ];
  }

  function exportSite(data) {
    return {
      columns: siteColumns.map((e) => {
        return { title: e.label, width: { wpx: 200 } };
      }),
      data: data.map((c) => {
        return [
          { value: c.phosphorylationSite },
          { value: c.accession },
          { value: c.phosphopeptide },
          {
            value: c.tumorSampleCount ? c.tumorSampleCount : "NA",
          },
          {
            value: c.normalSampleCount ? c.normalSampleCount : "NA",
          },
        ];
      }),
    };
  }

  function getTimestamp() {
    const date = new Date();

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return year + month + day + minutes + seconds;
  }

  return (
    <Tabs activeKey={tab} onSelect={(e) => setTab(e)} className="mb-3">
      <Tab eventKey="summaryView" title="Summary">
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
                    form.cancer.find(
                      (d) => d.value === parseInt(e.target.value),
                    ).label,
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
              data={geneScatter}
              layout={{
                ...defaultLayout,
                title: `<b>${label} ${firstGene} and ${secondGene} Correlation</b>`,
                autosize: true,
                legend: {
                  orientation: "h",
                  y: -0.2,
                  x: 0.42,
                },
                annotations: [
                  {
                    text: proteinGene.length === 0 ? "No data available" : "",
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
              config={defaultConfig}
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

      {(form.dataset.value === "phosphoproteinData" ||
        form.dataset.value === "phosphoproteinRatioData") && (
        <Tab eventKey="siteView" title="Phosphorylation Site">
          <Row className="m-3">
            <Form.Group className="col-md-2" controlId="siteTumor">
              <Form.Label className="required">Tumor Type</Form.Label>
              <Select
                name="firstSite"
                value={siteTumor}
                options={form.cancer}
                onChange={(e) => {
                  setSiteTumor(e);
                }}
              />
            </Form.Group>
            <Form.Group className="col-md-2" controlId="site1">
              <Form.Label className="required">
                {firstGene} Phosphorylation Site
              </Form.Label>
              <Select
                name="firstSite"
                value={firstSite.value}
                options={firstSites.map((e) => {
                  return { value: e[0], label: e[0] };
                })}
                onChange={(e) => {
                  setFirstSite(e.value);
                }}
              />
            </Form.Group>

            <Form.Group className="col-md-2" controlId="site2">
              <Form.Label className="required">
                {secondGene} Phosphorylation Site
              </Form.Label>
              <Select
                name="firstSite"
                value={secondSite.value}
                options={secondSites.map((e) => {
                  return { value: e[0], label: e[0] };
                })}
                onChange={(e) => {
                  setSecondSite(e.value);
                }}
              />
            </Form.Group>
            <Form.Group className="col-md-4 mt-2 col-form-label ">
              <br />
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
          </Row>

          <Row className="mx-3 mt-3">
            <Col xl={12}>
              <Plot
                data={siteScatter}
                layout={{
                  ...defaultLayout,
                  title:
                    siteTumor && firstSite && secondSite
                      ? `<b>${label} ${form.gene.label}/${firstSite} and ${form.correlatedGene.label}/${secondSite} Correlation</b>`
                      : "",
                  autosize: true,
                  legend: {
                    orientation: "h",
                    y: -0.2,
                    x: 0.42,
                  },
                  annotations: [
                    {
                      text: siteData.length === 0 ? "No data available" : "",
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
                config={defaultConfig}
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
                {siteData.length
                  ? calculateCorrelation(
                      siteData.map((e) =>
                        numType === "log2" ? e.firstTumor : e.firstTumorNum,
                      ),
                      siteData.map((e) =>
                        numType === "log2" ? e.secondTumor : e.secondTumorNum,
                      ),
                      { decimals: 4 },
                    )
                  : "NA"}
              </div>
              <div className="col-xl-4 my-2 d-flex justify-content-center">
                Control Correlation:{" "}
                {siteData.length
                  ? calculateCorrelation(
                      siteData.map((e) =>
                        numType === "log2" ? e.firstControl : e.firstControlNum,
                      ),
                      siteData.map((e) =>
                        numType === "log2"
                          ? e.secondControl
                          : e.secondControlNum,
                      ),
                      { decimals: 4 },
                    )
                  : "NA"}
              </div>

              <div className="col-xl-4 my-2 d-flex justify-content-center">
                Total Correlation:{" "}
                {siteData.length
                  ? calculateCorrelation(
                      siteData
                        .map((e) =>
                          numType === "log2"
                            ? e.firstControl
                            : e.firstControlNum,
                        )
                        .concat(
                          siteData.map((e) =>
                            numType === "log2" ? e.firstTumor : e.firstTumorNum,
                          ),
                        ),
                      siteData
                        .map((e) =>
                          numType === "log2"
                            ? e.secondControl
                            : e.secondControlNum,
                        )
                        .concat(
                          siteData.map((e) =>
                            numType === "log2"
                              ? e.secondTumor
                              : e.secondTumorNum,
                          ),
                        ),
                      { decimals: 4 },
                    )
                  : "NA"}
              </div>
            </Row>
          </fieldset>
          <div className="m-3">
            <div className="row">
              <b
                className="col mx-3"
                style={{ textDecorationLine: "underline" }}>
                {form.gene.label}
              </b>
              <div
                className="col d-flex"
                style={{ justifyContent: "flex-end" }}>
                <ExcelFile
                  filename={`CPROSITE-${
                    form.dataset.value === "proteinData"
                      ? "ProteinAbundance"
                      : "Phosphorylation"
                  }-${firstSite}-Correlation-${getTimestamp()}`}
                  element={<a href="javascript:void(0)">Export Data</a>}>
                  <ExcelSheet
                    dataSet={exportSiteSettings(form.gene.label)}
                    name="Input Configuration"
                  />
                  <ExcelSheet
                    dataSet={exportSite(
                      results[0].summary.records.filter(
                        (f) => f.cancerId === siteTumor.value,
                      ),
                    )}
                    name="Site Data"
                  />
                </ExcelFile>
              </div>
            </div>
            <Table
              columns={siteColumns}
              defaultSort={[{ id: "phosphorylationSite", asec: true }]}
              data={results[0].summary.records
                .filter((f) => f.cancerId === siteTumor.value)
                .map((c) => {
                  return {
                    phosphorylationSite: c.phosphorylationSite,
                    accession: c.accession,
                    phosphopeptide: c.phosphopeptide,
                    tumorSampleCount: c.tumorSampleCount
                      ? c.tumorSampleCount
                      : "NA",
                    normalSampleCount: c.normalSampleCount
                      ? c.normalSampleCount
                      : "NA",
                  };
                })}
            />
          </div>
          <div className="m-3">
            <div className="row">
              <b
                className="col mx-3"
                style={{ textDecorationLine: "underline" }}>
                {form.correlatedGene.label}
              </b>
              <div
                className="col d-flex"
                style={{ justifyContent: "flex-end" }}>
                <ExcelFile
                  filename={`CPROSITE-${
                    form.dataset.value === "proteinData"
                      ? "ProteinAbundance"
                      : "Phosphorylation"
                  }-${secondSite}-Correlation-${getTimestamp()}`}
                  element={<a href="javascript:void(0)">Export Data</a>}>
                  <ExcelSheet
                    dataSet={exportSiteSettings(form.correlatedGene.label)}
                    name="Input Configuration"
                  />
                  <ExcelSheet
                    dataSet={exportSite(
                      results[1].summary.records.filter(
                        (f) => f.cancerId === siteTumor.value,
                      ),
                    )}
                    name="Site Data"
                  />
                </ExcelFile>
              </div>
            </div>
            <Table
              columns={siteColumns}
              defaultSort={[{ id: "phosphorylationSite", asec: true }]}
              data={results[1].summary.records
                .filter((f) => f.cancerId === siteTumor.value)
                .map((c) => {
                  return {
                    phosphorylationSite: c.phosphorylationSite,
                    accession: c.accession,
                    phosphopeptide: c.phosphopeptide,
                    tumorSampleCount: c.tumorSampleCount
                      ? c.tumorSampleCount
                      : "NA",
                    normalSampleCount: c.normalSampleCount
                      ? c.normalSampleCount
                      : "NA",
                  };
                })}
            />
          </div>
        </Tab>
      )}
    </Tabs>
  );
}
