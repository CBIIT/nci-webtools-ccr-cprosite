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

import { useImperativeHandle, useState } from "react";
import _ from "lodash";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.Excelsheet;

export default function PhosResults() {
  const form = useRecoilValue(formState);
  const tumors = form.cancer;
  const results = useRecoilValue(resultsState);
  const [view, setView] = useState(form.cancer[0].value);

  const [tab, setTab] = useState("summaryView");
  const [plotTab, setPlot] = useState("tumorVsControl");
  const currentTumor = form.cancer.find((e) => e.value === view)
    ? view
    : form.cancer[0].value;

  const sortResults = Object.entries(
    _.groupBy(results[0].participants.records, "cancerId"),
  ).filter((e) => e[0] !== "null");

  var sortSummary = Object.entries(
    _.groupBy(results[0].summary.records, "phosphorylationSite"),
  ).filter((e) => e[0] !== "null" && e[0] !== "all");

  const heatmap = sortSummary.map((e) => {
    var toAdd = Array(10).fill(null);
    e[1].map((f) => {
      if (f.tumorSampleMean !== null && f.normalSampleMean !== null) {
        const logFoldChange = Number(
          (f.normalSampleMean - f.tumorSampleMean).toFixed(4),
        );
        toAdd[tumors.map((e) => e.value).indexOf(f.cancerId)] = logFoldChange;
      }
    });
    return toAdd;
  });

  const heatMapData = [
    {
      z: heatmap,
      x: tumors.map((e) => e.label),
      y: sortSummary.map((e) => e[0]),
      type: "heatmap",
      hoverongaps: false,
      colorbar: {
        title: {
          text: "Log Fold Change",
        },
      },
      hovertemplate:
        "Tumor: %{x}<br>Phospho Site: %{y}<br>Log Fold Change: %{z}<extra></extra>",
    },
  ];

  function summaryViewData() {
    var rows = [];
    console.log(results);
    sortSummary.map((c) => {
      c[1].map((e) => {
        const currentTumor = tumors.find((f) => f.value === e.cancerId);
        rows = rows.concat({
          tumor: (
            <a
              key={"summary-" + currentTumor.label}
              onClick={() => {
                setView(currentTumor.value);
                setTab("tumorView");
              }}
              href="javascript:void(0)">
              {currentTumor.label}
            </a>
          ),
          accession: e.accession ? e.accession : "NA",
          phosphorylationSite: (
            <a
              key={"summary-" + e.phosphorylationSite}
              onClick={() => {
                setView(currentTumor.value);
                setPhosView(e.phosphorylationSite);
                setTab("phosView");
              }}
              href="javascript:void(0)">
              {e.phosphorylationSite}
            </a>
          ),
          proteinDiff:
            e.tumorSampleMean !== null && e.normalSampleMean !== null
              ? Number((e.normalSampleMean - e.tumorSampleMean).toFixed(4))
              : "NA",
          tumorNum: e.tumorSampleCount !== null ? e.tumorSampleCount : "NA",
          controlNum: e.normalSampleCount !== null ? e.normalSampleCount : "NA",
        });
      });
    });
    return rows;
  }
  const tumorViewData = results[0].summary.records
    .filter(
      (f) =>
        f.cancerId ===
          (form.cancer.find((e) => e.value === view)
            ? view
            : form.cancer[0].value) && f.phosphorylationSite !== "all",
    )
    .map((e) => {
      const currentView = form.cancer.find((e) => e.value === view)
        ? view
        : form.cancer[0].value;
      const patients = sortResults
        .find((f) => Number(f[0]) === currentView)[1]
        .filter((d) => d.phosphorylationSite === e.phosphorylationSite);

      return {
        name: e.phosphorylationSite,
        phosphopeptide: patients.filter((d) => d.phosphopeptide !== null)[0]
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
            ? Number((e.normalSampleMean - e.tumorSampleMean).toFixed(4))
            : "NA",
        link: (
          <a
            key={"tumor-" + e.phosphorylationSite}
            onClick={() => {
              setPhosView(e.phosphorylationSite);
              setTab("phosView");
              setSite(patients.filter((d) => d.phosphopeptide !== null)[0]);
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
    sortResults.length > 0
      ? sortResults[0][1].filter((f) => f.accession && f.phosphopeptide)[0]
      : "",
  );

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

  const summaryColumns = [
    {
      accessor: "tumor",
      id: "tumor",
      label: "Tumor Type",
      Header: (
        <OverlayTrigger overlay={<Tooltip id="tumor_type">Tumor Type</Tooltip>}>
          <b>Tumor Type</b>
        </OverlayTrigger>
      ),
      sort: true,
      sortType: (a, b) =>
        a.original.tumor.key > b.original.tumor.key ? 1 : -1,
    },
    {
      accessor: "phosphorylationSite",
      label: "Phosphorylation Site",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="tumor_type">Phosphorylation Site</Tooltip>}>
          <b>Phospho Site.</b>
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
          overlay={<Tooltip id="phos_accession">Accession</Tooltip>}>
          <b>Accession</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "proteinDiff",
      label: "Log2 Fold Change",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="tumor_type">
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
      label: "Tumor Count",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="tumor_type">Tumor Sample Number</Tooltip>}>
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
            <Tooltip id="tumor_type">Adjacent Normal Sample Number</Tooltip>
          }>
          <b>Adj. Normal Count</b>
        </OverlayTrigger>
      ),
    },
  ];

  const tumorColumns = [
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
      sort: true,
      sortType: (a, b) => (a.original.link.key > b.original.link.key ? 1 : -1),
    },
    {
      accessor: "phosphopeptide",
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

  const multiPhosBarPlot = [
    {
      x: tumorViewData.map((c) => c.name),
      y: tumorViewData.map((c) => c.tumorAverage),
      error_y: {
        type: "data",
        array: tumorViewData.map((c) => c.tumorError),
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
      x: tumorViewData.map((c) => c.name),
      y: tumorViewData.map((c) => c.controlAverage),
      error_y: {
        type: "data",
        array: tumorViewData.map((c) => c.controlError),
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
          name: "<b>Tumor</b>",
          jitter: 0.6,
          marker: {
            size: 10,
            color: "rgb(255,0,0)",
          },
          hovertemplate: "Tumor Abundance: %{y}<extra></extra>",
        },
        {
          y: tumorViewData.length
            ? tumorViewData
                .find((e) => e.name === phosView)
                .records.map((d) => d.normalValue)
            : [],
          type: "box",
          boxpoints: "all",
          name: "<b>Adjacent Normal</b>",
          jitter: 0.6,
          jitter: 0.6,
          marker: {
            size: 10,
            color: "rgb(31,119,180)",
          },
          hovertext: ["1", "2"],
          hoverinfo: "x+y",
          hovertemplate: "Adj. Normal Abundance: %{y}<extra></extra>",
        },
      ];
    }

    return [];
  }

  function handleToggle(e) {
    setPlot(e.target.control.id);
  }

  function foldData() {
    if (tumorViewData.find((c) => c.name === phosView)) {
      var caseList = tumorViewData
        .find((c) => c.name === phosView)
        .records.filter((e) => e.tumorValue && e.normalValue)
        .sort((a, b) => {
          const aFoldChange = a.normalValue - a.tumorValue;
          const bFoldChange = b.normalValue - b.tumorValue;

          return aFoldChange > bFoldChange ? 1 : -1;
        });

      const values = caseList.map((c) =>
        Number(
          (
            Number(c.normalValue.toFixed(4)) - Number(c.tumorValue.toFixed(4))
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
          hovertemplate: "%{y} Log Fold Change: %{x}<extra></extra>",
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
          hovertemplate: "%{y} Log Fold Change: %{x}<extra></extra>",
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
      title: "<b>Protein Abundance<b>",
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
          { title: "Tumors", width: { wpx: 160 } },
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
      columns: summaryColumns.map((e) => {
        return { title: e.label, width: { wpx: 200 } };
      }),
      data: summaryViewData().map((e) => {
        return [
          { value: e.tumor.props.children },
          { value: e.phosphorylationSite.props.children },
          { value: e.accession },
          { value: e.proteinDiff },
          { value: e.tumorNum },
          { value: e.controlNum },
        ];
      }),
    },
  ];

  function exportTumorSettings() {
    return [
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
                : form.cancer[0].label,
            },
            { value: "Phosphorylation Site" },
            { value: "Tumor vs Control" },
            { value: form.gene.label },
          ],
        ],
      },
    ];
  }

  const exportTumor = [
    {
      columns: tumorColumns.map((e) => {
        return { title: e.label, width: { wpx: 200 } };
      }),
      data: tumorViewData.map((e) => {
        return [
          { value: e.name },
          { value: e.phosphopeptide },
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
          {
            value: form.cancer.find((e) => e.value === view)
              ? form.cancer.find((e) => e.value === view).label
              : form.cancer[0].label,
          },
          { value: phosView },
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
          tumorViewData.length && tumorViewData.find((e) => e.name === phosView)
            ? tumorViewData
                .find((e) => e.name === phosView)
                .records.map((d) => {
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
                })
            : [],
      },
    ];
  }

  return (
    <Tabs activeKey={tab} onSelect={(e) => setTab(e)} className="mb-3">
      <Tab eventKey="summaryView" title="Summary View">
        <div className="m-3">
          <Plot
            data={heatMapData}
            layout={{
              ...defaultLayout,
              title: `<b>Phosphorylation Site Tumor vs Adjacent Normal</b> (${form.gene.label})`,
              xaxis: {
                title: "<b>Tumor Type</b>",
                automargin: true,
                titlefont: {
                  size: 15,
                },
              },
              yaxis: {
                title: "<b>Phosphorylation Site</b>",
                automargin: true,
                titlefont: {
                  size: 15,
                },
              },
              autosize: true,
            }}
            useResizeHandler
            config={{
              ...defaultConfig,
              toImageButtonOptions: {
                ...defaultConfig.toImageButtonOptions,
                filename: `Phosphorylation_Site_Tumor_vs_Adjacent_Normal-${form.gene.label}`,
              },
            }}
            style={{
              height: "800px",
              width: `100%`,
              minWidth: "100%",
            }}
          />
          <div className="mx-3" style={{ color: "grey" }}>
            Note: Fold Change may not be statistically significant.
          </div>
        </div>

        <div className="m-3">
          <div className="d-flex" style={{ justifyContent: "flex-end" }}>
            <ExcelFile
              filename={`Phosphorylation_Site_Tumor_vs_Adjacent_Normal-${form.gene.label}`}
              element={<a href="javascript:void(0)">Export Data</a>}>
              <ExcelSheet
                dataSet={exportSummarySettings()}
                name="Input Configuration"
              />
              <ExcelSheet dataSet={exportSummary} name="Summary Data" />
            </ExcelFile>
          </div>

          <Table
            columns={summaryColumns}
            defaultSort={[{ id: "tumor", asec: true }]}
            data={summaryViewData()}
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
              onChange={(c) => {
                setView(parseInt(c.target.value));
                const phos = sortResults.find(
                  (e) => Number(e[0]) === parseInt(c.target.value),
                )
                  ? Object.entries(
                      _.groupBy(
                        sortResults.find(
                          (e) => Number(e[0]) === parseInt(c.target.value),
                        )[1],
                        "phosphorylationSite",
                      ),
                    ).filter((e) => e[0] !== "null")
                  : [];
                setPhosView(phos.length ? phos[0][0] : "");
                setSite(phos.length ? phos[0][1][0] : "");
              }}
              value={
                form.cancer.find((e) => e.value === view)
                  ? view
                  : form.cancer[0].value
              }
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
                title: `<b>${
                  form.cancer.find((f) => f.value === currentTumor).label
                } Phosphorylation Site Tumor vs Adjacent Normal</b> (${
                  form.gene.label
                })`,
                xaxis: {
                  title: "<b>Phosphorylation Site</b>",
                  zeroline: false,
                  titlefont: {
                    size: 15,
                  },
                },
                yaxis: {
                  title: "<b>Phosphorylation Level</b>",
                  zeroline: false,
                  titlefont: {
                    size: 15,
                  },
                },
                barmode: "group",
                autosize: true,
                legend: {
                  orientation: "h",
                  y: -0.25,
                  x: 0.42,
                },
                annotations: [
                  {
                    text: tumorViewData.length === 0 ? "No data available" : "",
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
                  }_Phosphorylation_Site_Tumor_vs_Adjacent_Normal-${
                    form.gene.label
                  }`,
                },
              }}
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

        <div className="m-3">
          <div className="d-flex" style={{ justifyContent: "flex-end" }}>
            <ExcelFile
              filename={`${
                form.cancer.find((f) => f.value === currentTumor).label
              }_Phosphorylation_Site_Tumor_vs_Adjacent_Normal-${
                form.gene.label
              }`}
              element={<a href="javascript:void(0)">Export Data</a>}>
              <ExcelSheet
                dataSet={exportTumorSettings()}
                name="Input Configuration"
              />
              <ExcelSheet dataSet={exportTumor} name="Tumor View Data" />
            </ExcelFile>
          </div>
          <Table
            columns={tumorColumns}
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
                setSite(tumorViewData.find((f) => f.name === e.target.value));
              }}
              value={phosView}
              required>
              {tumorViewData.map((c) => (
                <option value={c.name} key={`dataset-${c.name}`}>
                  {c.name}
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
          {plotTab === "tumorVsControl" ? (
            <Col xl={12} style={{ height: "800px" }}>
              <Plot
                data={phosBoxData()}
                layout={{
                  ...defaultLayout,
                  title: `<b>${phosView} ${
                    form.cancer.find((f) => f.value === currentTumor).label
                  } Tumor vs Adjacent Normal</b> (${form.gene.label})`,
                  yaxis: {
                    title:
                      "<b>Relative Phosphorylation Level (TMT log2 value)</b>",
                    zeroline: false,
                    titlefont: {
                      size: 15,
                    },
                  },
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
                        !tumorViewData.find((e) => e.name === phosView) ||
                        tumorViewData.find((e) => e.name === phosView).records
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
                    filename: `${phosView}_${
                      form.cancer.find((f) => f.value === currentTumor).label
                    }_Phosphorylation_Site_Tumor_vs_Adjacent_Normal-${
                      form.gene.label
                    }`,
                  },
                }}
                useResizeHandler
                style={{ height: "800px", minWidth: "100%" }}
              />
            </Col>
          ) : (
            <Col xl={12} style={{ height: "800px", overflowY: "auto" }}>
              <Plot
                data={foldData()}
                config={{
                  ...defaultConfig,
                  toImageButtonOptions: {
                    ...defaultConfig.toImageButtonOptions,
                    filename: `${phosView}_${
                      form.cancer.find((f) => f.value === currentTumor).label
                    }_Phosphorylation_Site_Tumor_vs_Adjacent_Normal_Log_Fold_Change-${
                      form.gene.label
                    }`,
                  },
                }}
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
                    title: "<b>Log<sub>2</sub> Fold Change</b>",
                    zeroline: false,
                    titlefont: {
                      size: 15,
                    },
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
                        !tumorViewData.find((c) => c.name === phosView) ||
                        tumorViewData
                          .find((c) => c.name === phosView)
                          .records.filter((e) => e.tumorValue && e.normalValue)
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
            <ExcelFile
              filename={`${phosView}_${
                form.cancer.find((f) => f.value === currentTumor).label
              }_Phosphorylation_Site_Tumor_vs_Adjacent_Normal-${
                form.gene.label
              }`}
              element={<a href="javascript:void(0)">Export Data</a>}>
              <ExcelSheet
                dataSet={exportSiteSettings}
                name="Input Configuration"
              />
              <ExcelSheet dataSet={exportSite()} name="Phosphorylation Site" />
            </ExcelFile>
          </div>
          <Table
            columns={phosSiteColumns}
            defaultSort={[{ id: "participantId", asec: true }]}
            data={
              tumorViewData.length &&
              tumorViewData.find((e) => e.name === phosView)
                ? tumorViewData
                    .find((e) => e.name === phosView)
                    .records.map((d) => {
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
