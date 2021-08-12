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
import { formState, siteState, resultsState } from "./explore.state";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import ReactExport from "react-data-export";

import { useImperativeHandle, useState } from "react";
import _ from "lodash";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.Excelsheet;

export default function PhosResults() {
  const form = useRecoilValue(formState);
  const results = useRecoilValue(resultsState);
  const [view, setView] = useState(form.cancer[0].value);

  const [tab, setTab] = useState("tumorView");
  const [plotTab, setPlot] = useState("tumorVsControl");

  console.log(results);

  const sortResults = Object.entries(
    _.groupBy(
      results.find((e) => e.cancer.value === view).participants.records,
      "phosphorylationSite",
    ),
  ).filter((e) => e[0] !== "null");

  console.log(sortResults);

  const tumorViewData = results
    .find((e) => e.cancer.value === view)
    .summary.records.map((e) => {
      console.log(e);
      const patients = sortResults.find(
        (d) => d[0] === e.phosphorylationSite,
      )[1];

      return {
        name: e.phosphorylationSite,
        peptide: patients.filter((d) => d.phosphopeptide !== null)[0]
          .phosphopeptide,
        accession: patients.filter((d) => d.accession != null)[0].accession,
        tumorAverage:
          e.tumorSampleMean !== null
            ? Number(e.tumorSampleMean.toFixed(4))
            : "NA",
        controlAverage:
          e.normalSampleMean !== null
            ? Number(e.normalSampleMean.toFixed(4))
            : "NA",
        proteinDiff:
          e.tumorSampleMean !== null && e.normalSampleMean !== null
            ? Number((e.tumorSampleMean - e.normalSampleMean).toFixed(4))
            : "NA",
        link: (
          <a
            onClick={() => {
              setPhosView(e.phosphorylationSite);
              setTab("phosView");
            }}
            href="javascript:void(0)">
            {e.phosphorylationSite}
          </a>
        ),
        pValuePaired:
          e.pValuePaired !== null ? Number(e.pValuePaired.toFixed(4)) : "NA",
        pValueUnpaired:
          e.pValueUnpaired !== null
            ? Number(e.pValueUnpaired.toFixed(4))
            : "NA",
        tumorNum:
          e.tumorSampleCount !== null
            ? Number(e.tumorSampleCount.toFixed(4))
            : "NA",
        controlNum:
          e.normalSampleCount !== null
            ? Number(e.normalSampleCount.toFixed(4))
            : "NA",
        tumorError:
          e.tumorSampleStandardError !== null
            ? Number(e.tumorSampleStandardError.toFixed(4))
            : "NA",
        controlError:
          e.normalSampleStandardError !== null
            ? Number(e.normalSampleStandardError.toFixed(4))
            : "NA",
        records: patients,
      };
    });

  const [phosView, setPhosView] = useState(
    tumorViewData.length > 0 ? tumorViewData[0].name : "",
  );
  const [site, setSite] = useState(
    sortResults.length > 0 ? sortResults[0][1][0] : "",
  );

  console.log(tumorViewData);
  console.log(phosView);

  const phosSiteColumns = [
    {
      accessor: "participantId",
      id: "participantId",
      label: "Patient ID",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="phos_patient">Patient ID</Tooltip>}>
          <b>Patient ID</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "tumorValue",
      label: "Tumor Abundance",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="phos_tumor_val">Tumor Abundance</Tooltip>}>
          <b>Tumor Abundance</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "controlValue",
      label: "Adjacent Normal Abundance",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="phos_control_val">Adjacent Normal Abundance</Tooltip>
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
            <Tooltip id="protein_diff">
              Difference between Tumor and Adjacent Normal Abundance
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
      id: "link",
      label: "Phosphorylation Site",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="phos_site">Phosphorylation Site</Tooltip>}>
          <b>Phsopho. Site</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "accession",
      label: "Accession",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="phos_accession">Accession</Tooltip>}>
          <b>Accession</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "peptide",
      label: "Peptide",
      Header: (
        <OverlayTrigger overlay={<Tooltip id="phos_peptide">Peptide</Tooltip>}>
          <b>Peptide</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "tumorAverage",
      label: "Average Tumor",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="phos_av_tumor">Average Tumor</Tooltip>}>
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
            <Tooltip id="phos_av_control">Average Adjacent Normal</Tooltip>
          }>
          <b>Avg. Adj. Normal</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "proteinDiff",
      label: "Log2 Fold Change",
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
            <Tooltip id="phos_tumor_count">Tumor Sample Number</Tooltip>
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
            <Tooltip id="phos_control_count">
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
          overlay={<Tooltip id="phos_tumor_se">Tumor Standard Error</Tooltip>}>
          <b>Tumor SE</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "controlError",
      label: "Adjacent Normal Standard Error",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="phos_control_se">
              Adjacent Normal Standard Error
            </Tooltip>
          }>
          <b>Adj. Normal SE</b>
        </OverlayTrigger>
      ),
    },
  ];

  const multiPhosBarPlot = [
    {
      x: tumorViewData.map((c) => c.name),
      y: tumorViewData.map((c) => c.tumorAverage),
      error_y: {
        type: "data",
        array: tumorViewData.map((c) => c.tumorError),
        visible: true,
        color: "rgb(31,119,180)",
      },
      type: "bar",
      name: "Tumor",
      hovertemplate: "%{x}: %{y} <extra></extra>",
    },
    {
      x: tumorViewData.map((c) => c.name),
      y: tumorViewData.map((c) => c.controlAverage),
      error_y: {
        type: "data",
        array: tumorViewData.map((c) => c.controlError),
        visible: true,
        color: "rgb(255,127,14)",
      },
      type: "bar",
      name: "Adjacent Normal",
      hovertemplate: "%{x}: %{y} <extra></extra>",
    },
  ];

  function phosBoxData() {
    if (tumorViewData.find((e) => e.name === phosView)) {
      return [
        {
          y: tumorViewData.length
            ? tumorViewData
                .find((e) => e.name === phosView)
                .records.map((d) => d.tumorValue)
            : [],
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
          y: tumorViewData.length
            ? tumorViewData
                .find((e) => e.name === phosView)
                .records.map((d) => d.normalValue)
            : [],
          type: "box",
          boxpoints: "all",
          name: "Adjacent Normal",
          jitter: 0.6,
          jitter: 0.6,
          marker: {
            size: 8,
          },
          hovertext: ["1", "2"],
          hoverinfo: "x+y",
          hovertemplate: "%{y}<extra></extra>",
        },
      ];
    }

    return [];
  }

  function handleToggle(e) {
    setPlot(e.target.control.id);
  }

  function foldData() {
    console.log(sortResults);
    console.log(phosView);

    if (sortResults.find((c) => c[0] === phosView)) {
      var caseList = sortResults
        .find((c) => c[0] === phosView)[1]
        .filter((e) => e.tumorValue && e.normalValue)
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
    } else {
      return [];
    }
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

  function exportSummarySettings() {
    var settings = form.cancer.map((e) => {
      return [{ value: e.label }];
    });
    settings[0].push({ value: "Phosphorylation Site" });
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

  const exportSummary = [
    {
      columns: summary.map((e) => {
        return { title: e.label, width: { wpx: 200 } };
      }),
      data: tumorViewData.map((e) => {
        return [
          { value: e.name },
          { value: e.accession },
          { value: e.peptide },
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

  const exportSiteSettings = [
    {
      columns: [
        { title: "Tumor Type", width: { wpx: 160 } },
        { title: "Phosphorylation Site", width: { wpx: 200 } },
        { title: "Dataset", width: { wpx: 160 } },
        { title: "Analysis", width: { wpx: 160 } },
        { title: "Gene", width: { wpx: 160 } },
      ],
      data: [
        [
          { value: form.cancer.find((e) => e.value === view).label },
          { value: site.phosphorylationSite },
          { value: "Phosphorylation Site" },
          { value: "Tumor vs Control" },
          { value: form.gene.label },
        ],
      ],
    },
  ];

  function exportSite() {
    return [
      {
        columns: phosSiteColumns.map((e) => {
          return { title: e.label, width: { wpx: 160 } };
        }),
        data:
          sortResults.length > 0
            ? sortResults.find((c) => c[0] === phosView)[1]
            : [].map((d) => {
                return [
                  { value: d.participantId },
                  { value: d.tumorValue ? d.tumorValue.toFixed(4) : "NA" },
                  { value: d.normalValue ? d.normalValue.toFixed(4) : "NA" },
                  {
                    value:
                      d.tumorValue && d.normalValue
                        ? (
                            d.normalValue.toFixed(4) - d.tumorValue.toFixed(4)
                          ).toFixed(4)
                        : "NA",
                  },
                ];
              }),
      },
    ];
  }

  console.log(tumorViewData);
  return (
    <Tabs activeKey={tab} onSelect={(e) => setTab(e)} className="mb-3">
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
              onChange={(c) => {
                setView(parseInt(c.target.value));
                console.log(results);
                const phos = Object.entries(
                  _.groupBy(
                    results.find(
                      (e) => e.cancer.value === parseInt(c.target.value),
                    ).participants.records,
                    "phosphorylationSite",
                  ),
                ).filter((e) => e[0] !== "null");
                console.log(phos);
                setPhosView(phos.length ? phos[0][0] : "");
                setSite(phos.length ? phos[0][1][0] : "");
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
          <Col xl={12} style={{ overflowX: "auto" }}>
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
                legend: {
                  orientation: "h",
                  y: -0.25,
                  x: 0.37,
                },
                annotations: [
                  {
                    text: tumorViewData.length === 0 ? "No data available" : "",
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
              style={{
                height: "500px",
                width: `${tumorViewData.length * 50}px`,
                minWidth: "100%",
              }}
            />
          </Col>
        </Row>

        {console.log(new Date().toLocaleDateString())}
        <div className="m-3">
          <div className="d-flex" style={{ justifyContent: "flex-end" }}>
            <ExcelFile
              filename=""
              element={<a href="javascript:void(0)">Export Data</a>}>
              <ExcelSheet
                dataSet={exportSummarySettings()}
                name="Input Configuration"
              />
              <ExcelSheet dataSet={exportSummary} name="Summary Data" />
            </ExcelFile>
          </div>
          <Table
            columns={summary}
            data={tumorViewData}
            defaultSort={[{ id: "link", asec: true }]}
          />
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
                setSite(sortResults.find((c) => c[0] === e.target.value)[1][0]);
              }}
              value={phosView}
              required>
              {sortResults.map((c) => (
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
              Log Fold Change
            </ToggleButton>
          </ToggleButtonGroup>
        </Form.Group>

        <Row className="mx-3 mt-3">
          {plotTab === "tumorVsControl" ? (
            <Col xl={12} style={{ height: "800px" }}>
              <Plot
                data={phosBoxData()}
                layout={{
                  ...defaultLayout,
                  title: `<b>${
                    form.cancer.find((e) => e.value === view).label
                  } Tumor vs Adjacent Normal</b> (Gene: ${
                    form.gene.label
                  }/Unpaired P-Value: ${
                    tumorViewData.find((e) => e.name === phosView)
                      ? tumorViewData.find((e) => e.name === phosView)
                          .pValueUnpaired
                      : "NA"
                  })`,
                  yaxis: { title: "Phosphorylation Level", zeroline: false },
                  autosize: true,
                  boxgroupgap: 0.4,
                  boxgap: 0.4,
                  legend: {
                    orientation: "h",
                    y: -0.1,
                    x: 0.37,
                  },
                  annotations: [
                    {
                      text:
                        tumorViewData.length === 0 ||
                        tumorViewData.find((e) => e.name === phosView).records
                          .length === 0
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
                style={{ height: "800px", minWidth: "100%" }}
              />
            </Col>
          ) : (
            <Col xl={12} style={{ height: "800px", overflowY: "auto" }}>
              <Plot
                data={foldData()}
                config={defaultConfig}
                layout={{
                  autosize: true,
                  title: `<b>Log<sub>2</sub> Fold Change</b> (Gene: ${
                    form.gene.label
                  }/Paired P-Value: ${
                    tumorViewData.find((e) => e.name === phosView)
                      ? tumorViewData.find((e) => e.name === phosView)
                          .pValuePaired
                      : "NA"
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
                      text:
                        sortResults.length === 0 ||
                        sortResults
                          .find((c) => c[0] === phosView)[1]
                          .filter((e) => e.tumorValue && e.normalValue)
                          .length === 0
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
                  height: `${
                    foldData().length ? foldData()[0].x.length * 20 : "400"
                  }px`,
                  minHeight: "400px",
                }}
              />
            </Col>
          )}
        </Row>

        <fieldset className="mx-5 mb-5 border row" style={{ color: "grey" }}>
          <div className="col-xl-6 my-2 d-flex justify-content-center">
            Accession: {site.accession}
          </div>

          <div className="col-xl-6 my-2 d-flex justify-content-center">
            Peptide: {site.phosphopeptide}
          </div>
        </fieldset>

        <Row className="m-3">
          <div className="d-flex" style={{ justifyContent: "flex-end" }}>
            <ExcelFile element={<a href="javascript:void(0)">Export Data</a>}>
              <ExcelSheet
                dataSet={exportSiteSettings}
                name="Input Configuration"
              />
              <ExcelSheet dataSet={exportSite()} name="Phosphorylation Site" />
            </ExcelFile>
          </div>
          <Table
            columns={phosSiteColumns}
            defaultSort={[{ id: "name", asec: true }]}
            data={
              sortResults.length
                ? sortResults
                    .find((e) => e[0] === phosView)[1]
                    .map((d) => {
                      return {
                        participantId: d.participantId,
                        tumorValue: d.tumorValue
                          ? d.tumorValue.toFixed(4)
                          : "NA",
                        controlValue: d.normalValue
                          ? d.normalValue.toFixed(4)
                          : "NA",
                        proteinDiff:
                          d.tumorValue && d.normalValue
                            ? (
                                d.normalValue.toFixed(4) -
                                d.tumorValue.toFixed(4)
                              ).toFixed(4)
                            : "NA",
                      };
                    })
                : []
            }
          />
        </Row>
      </Tab>
    </Tabs>
  );
}
