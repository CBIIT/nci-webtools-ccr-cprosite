import { useRecoilValue } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Form from "react-bootstrap/Form";
import Table from "../components/table";
import TypeDropdownCorrelation from "../components/protain-correlation-dropdown"
import CorrelationToggleButton from "../components/correlation-togglebutton"

import Plot from "react-plotly.js";
import { formState, resultsState } from "./explore.state";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import calculateCorrelation from "calculate-correlation";
import { ExcelFile, ExcelSheet } from "../components/excel-export";
// import ReactExport from "react-data-export";
import Select from "react-select";

import { useState } from "react";
import _ from "lodash";

// const ExcelFile = ReactExport.ExcelFile;
// const ExcelSheet = ReactExport.ExcelFile.Excelsheet;

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
  const [label, setLabel] = useState(form.cancer[0].label);
  const [tab, setTab] = useState("summaryView");

  const getNumericPosition = (site) => +String(site).match(/\d+/g)[0] || 0;

  const datasetName =
    form.dataset.label === "Protein Abundance"
      ? "Protein_Abundance"
      : form.dataset.label === "Phosphorylation Site"
      ? "Phosphorylation_Site"
      : "Phosphorylation_Protein";
  const currentTumor = form.cancer.find((e) => e.value === view[0]) ? view : form.cancer.map((e) => e.value);

  const currentSiteTumor = form.cancer.find((e) => e.value === siteTumor.value)
    ? siteTumor.value
    : form.cancer[0].value;

  const currentLabel =
    form.dataset.label === "Protein Abundance" && currentTumor.length > 1
      ? ""
      : form.cancer.find((e) => e.value === siteTumor.value)
      ? label
      : form.cancer[0].label;

  var firstGeneSet = results[0].participants.records.filter((e) => tumors.includes(e.cancerId));

  var secondGeneSet = results[1].participants.records.filter((e) => tumors.includes(e.cancerId));

  const [numType, setNumType] = useState("log2");

  var firstSites = Object.entries(
    _.groupBy(
      results[0].participants.records.filter((f) => f.cancerId === currentSiteTumor),
      "phosphorylationSite",
    ),
  )
    .filter((e) => e[0] !== "null")
    .map((e) => {
      return { value: e[0], label: e[0] };
    })
    .sort((a, b) => {
      return getNumericPosition(a.value) - getNumericPosition(b.value);
    });

  var secondSites = Object.entries(
    _.groupBy(
      results[1].participants.records.filter((f) => f.cancerId === currentSiteTumor),
      "phosphorylationSite",
    ),
  )
    .filter((f) => f[0] !== "null")
    .map((e) => {
      return { value: e[0], label: e[0] };
    })
    .sort((a, b) => {
      return getNumericPosition(a.value) - getNumericPosition(b.value);
    });

  secondSites = [
    {
      value: form.correlatedGene.label,
      label: form.correlatedGene.label + " (Protein)",
    },
  ].concat(secondSites);

  const [first, setFirstSite] = useState({
    value: firstSites.length ? firstSites[0].value : "",
    label: firstSites.length ? firstSites[0].value : "",
  });
  const [second, setSecondSite] = useState({
    value: form.correlatedGene.label,
    label: form.correlatedGene.label + " (Protein)",
  });

  const firstSite = firstSites.find((f) => f.value === first.value)
    ? first
    : {
        value: firstSites.length ? firstSites[0].value : "",
        label: firstSites.length ? firstSites[0].value : "",
      };
  const secondSite = secondSites.find((f) => f.value === second.value)
    ? second
    : {
        value: form.correlatedGene.label,
        label: form.correlatedGene.label + " (Protein)",
      };

  function handleToggle(e) {
    setNumType(e.target.control.id);
  }

  const correlationColumns = [
    {
      accessor: "name",
      id: "name",
      label: "Patient ID",
      Header: (
        <OverlayTrigger overlay={<Tooltip id="protein_correlation_patient">Patient ID</Tooltip>}>
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
        <OverlayTrigger overlay={<Tooltip id="first_correlation_tumor_num">{firstGene} Tumor Abundance</Tooltip>}>
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
        <OverlayTrigger overlay={<Tooltip id="second_tumor_num">{secondGene} Tumor Abundance</Tooltip>}>
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
          overlay={<Tooltip id="protein_correlation_control_num">{firstGene} Adjacent Normal Abundance</Tooltip>}>
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
        <OverlayTrigger overlay={<Tooltip id="second_control_num">{secondGene} Adjacent Normal Abundance</Tooltip>}>
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
        <OverlayTrigger overlay={<Tooltip id="site_correlation_phospho">Phosphorylation Site</Tooltip>}>
          <b>Phospho. Site</b>
        </OverlayTrigger>
      ),
      sort: true,
      sortType: (a, b) => {
        return getNumericPosition(a.original.phosphorylationSite) - getNumericPosition(b.original.phosphorylationSite);
      },
    },
    {
      accessor: "accession",
      label: "Accession",
      Header: (
        <OverlayTrigger overlay={<Tooltip id="site_correlation_accession">Accession</Tooltip>}>
          <b>Accession</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "phosphopeptide",
      label: "Phosphopeptide",
      Header: (
        <OverlayTrigger overlay={<Tooltip id="site_correlation_peptide">Phosphopeptide</Tooltip>}>
          <b>Peptide</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "tumorSampleCount",
      label: "Tumor Count",
      Header: (
        <OverlayTrigger overlay={<Tooltip id="site_correlation_peptide">Tumor Sample Number</Tooltip>}>
          <b>Tumor Count</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "normalSampleCount",
      label: "Adjacent Normal Count",
      Header: (
        <OverlayTrigger overlay={<Tooltip id="site_correlation_peptide">Adjacent Normal Sample Number</Tooltip>}>
          <b>Adj. Normal Count</b>
        </OverlayTrigger>
      ),
    },
  ];

  const firstFilteredSet = firstGeneSet.filter((f) => currentTumor.includes(f.cancerId));
  const secondFilteredSet = secondGeneSet.filter((f) => currentTumor.includes(f.cancerId));

  //Organize datasets (unfiltered)
  const getData = firstFilteredSet.map((first) => {
    const second = secondFilteredSet.find((d) => {
      return first.participantId === d.participantId && first.phosphorylationSite === d.phosphorylationSite;
    });

    if (second) {
      return {
        name: first.participantId,
        firstTumor: first.tumorValue !== null ? Number(first.tumorValue.toFixed(4)) : "NA",
        firstTumorNum: first.tumorValue !== null ? Number(Math.pow(2, first.tumorValue).toFixed(4)) : "NA",
        firstControl: first.normalValue !== null ? Number(first.normalValue.toFixed(4)) : "NA",
        firstControlNum: first.normalValue !== null ? Number(Math.pow(2, first.normalValue).toFixed(4)) : "NA",
        secondTumor: second.tumorValue !== null ? Number(second.tumorValue.toFixed(4)) : "NA",
        secondTumorNum: second.tumorValue !== null ? Number(Math.pow(2, second.tumorValue).toFixed(4)) : "NA",
        secondControl: second.normalValue !== null ? Number(second.normalValue.toFixed(4)) : "NA",
        secondControlNum: second.normalValue !== null ? Number(Math.pow(2, second.normalValue).toFixed(4)) : "NA",
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
    (e) => e.firstTumor !== null && e.firstControl !== null && e.secondTumor !== null && e.secondControl !== null,
  );
  const proteinGeneCorrelation = proteinGene.filter(
    (e) => e.firstTumor !== "NA" && e.firstControl !== "NA" && e.secondTumor !== "NA" && e.secondControl !== "NA",
  );

  function getSite() {
    const currentTumor = form.cancer.find((e) => e.value === siteTumor.value) ? siteTumor.value : form.cancer[0].value;

    const firstFiltered = firstGeneSet.filter(
      (f) => f.cancerId === currentTumor && f.phosphorylationSite === firstSite.value,
    );

    var secondFiltered;
    if (
      secondSite.value === form.correlatedGene.label &&
      (form.dataset.value === "phosphoproteinData" || form.dataset.value === "phosphoproteinRatioData")
    ) {
      secondFiltered = results[1].protein.records.filter((f) => f.cancerId === currentTumor);
    } else {
      secondFiltered = secondGeneSet.filter(
        (f) => f.cancerId === currentTumor && f.phosphorylationSite === secondSite.value,
      );
    }
    var dataPoints = [];

    firstFiltered.map((first) => {
      const second = secondFiltered.filter((d) => {
        return first.participantId === d.participantId;
      });

      dataPoints = dataPoints.concat(
        second.map((e) => {
          return {
            name: first.participantId,
            firstPhospho: first.phosphorylationSite,
            secondPhospho: e.phosphorylationSite ? e.phosphorylationSite : form.correlatedGene.label,
            firstTumor: first.tumorValue !== null ? Number(first.tumorValue.toFixed(4)) : "NA",
            firstTumorNum: first.tumorValue !== null ? Number(Math.pow(2, first.tumorValue).toFixed(4)) : "NA",
            firstControl: first.normalValue !== null ? Number(first.normalValue.toFixed(4)) : "NA",
            firstControlNum: first.normalValue !== null ? Number(Math.pow(2, first.normalValue).toFixed(4)) : "NA",
            secondTumor: e.tumorValue !== null ? Number(e.tumorValue.toFixed(4)) : "NA",
            secondTumorNum: e.tumorValue !== null ? Number(Math.pow(2, e.tumorValue).toFixed(4)) : "NA",
            secondControl: e.normalValue !== null ? Number(e.normalValue.toFixed(4)) : "NA",
            secondControlNum: e.normalValue !== null ? Number(Math.pow(2, e.normalValue).toFixed(4)) : "NA",
          };
        }),
      );
    });

    return dataPoints;
  }

  const unfilteredSiteData = getSite();

  const siteData =
    form.dataset.value === "phosphoproteinData" || form.dataset.value === "phosphoproteinRatioData"
      ? unfilteredSiteData.filter(
          (e) =>
            (e.firstTumor !== "NA" && e.secondTumor !== "NA") || (e.firstControl !== "NA" && e.secondControl !== "NA"),
        )
      : [];

  const defaultLayout = {
    xaxis: {
      title: `<b>${firstGene} ${
        form.cancer.find((e) => e.value === currentTumor[0]).singlePool === 1 ? "Tumor/Normal" : ""
      }</b>`,
      zeroline: false,
      titlefont: {
        size: 16,
      },
    },
    yaxis: {
      title: `<b>${secondGene} ${
        form.cancer.find((e) => e.value === currentTumor[0]).singlePool === 1 ? "Tumor/Normal" : ""
      }</b>`,
      zeroline: false,
      titlefont: {
        size: 16,
      },
    },
    legend: {
      itemsizing: "constant",
      itemwidth: 40,
    },
    hovermode: "closest",
    hoverlabel: {
      bgcolor: "#FFF",
      font: { color: "#000", size: 15 },
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
    modeBarButtonsToRemove: ["select2d", "lasso2d", "hoverCompareCartesian", "hoverClosestCartesian"],
  };

  const geneScatter = [
    {
      x: proteinGeneCorrelation.map((e) => (numType === "log2" ? e.firstTumor : e.firstTumorNum)),
      y: proteinGeneCorrelation.map((e) => (numType === "log2" ? e.secondTumor : e.secondTumorNum)),
      marker: {
        size: 8,
        color: "rgb(255,0,0)",
      },
      mode: "markers",
      type: "scatter",
      name: "Tumor",
      hovertemplate:
        `${firstGene} Tumor ${numType === "log2" ? "Log2" : "Abundance"}: %{x}<br>` +
        `${secondGene} Tumor ${numType === "log2" ? "Log2" : "Abundance"}: %{y})<extra></extra>`,
    },
    {
      x: proteinGeneCorrelation
        .filter((f) => f.firstControl !== 0 && f.secondControl !== 0)
        .map((e) => (numType === "log2" ? e.firstControl : e.firstControlNum)),
      y: proteinGeneCorrelation
        .filter((f) => f.firstControl !== 0 && f.secondControl !== 0)
        .map((e) => (numType === "log2" ? e.secondControl : e.secondControlNum)),
      marker: {
        size: 8,
        color: "rgb(31,119,180)",
      },
      mode: "markers",
      type: "scatter",
      name: "Adjacent Normal",
      hovertemplate:
        `${firstGene} Control ${numType === "log2" ? "Log2" : "Abundance"}: %{x}<br>` +
        `${secondGene} Control ${numType === "log2" ? "Log2" : "Abundance"}: %{y}<extra></extra>`,
    },
  ];

  const siteScatter = [
    {
      x: siteData.map((e) => (numType === "log2" ? e.firstTumor : e.firstTumorNum)),
      y: siteData.map((e) => (numType === "log2" ? e.secondTumor : e.secondTumorNum)),
      marker: {
        size: 8,
        color: "rgb(255,0,0)",
      },
      mode: "markers",
      type: "scatter",
      name: "Tumor",
      hovertemplate:
        `${firstGene} Tumor ${numType === "log2" ? "Log2" : "Abundance"}: %{x}<br>` +
        `${secondGene} Tumor ${numType === "log2" ? "Log2" : "Abundance"}: %{y}<extra></extra>`,
    },
    {
      x: siteData
        .filter((f) => f.firstControl !== 0 && f.secondControl !== 0)
        .map((e) => (numType === "log2" ? e.firstControl : e.firstControlNum)),
      y: siteData
        .filter((f) => f.firstControl !== 0 && f.secondControl !== 0)
        .map((e) => (numType === "log2" ? e.secondControl : e.secondControlNum)),
      marker: {
        size: 8,
        color: "rgb(31,119,180)",
      },
      mode: "markers",
      type: "scatter",
      name: "Adjacent Normal",
      hovertemplate:
        `${firstGene} Control ${numType === "log2" ? "Log2" : "Abundance"}: %{x}<br>` +
        `${secondGene} Control ${numType === "log2" ? "Log2" : "Abundance"}: %{y}<extra></extra>`,
    },
  ];

  function exportSummarySettings() {
    var settings = form.cancer
      .filter((f) => view.find((c) => c === f.value))
      .map((e) => {
        return [{ value: e.label }];
      });

    if (settings.length === 0) settings.push([{ value: form.cancer[0].label }]);

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
              value: form.cancer.find((e) => e.value === siteTumor.value)
                ? form.cancer.find((f) => f.value === siteTumor.value).label
                : form.cancer[0].label,
            },
            { value: form.dataset.label },
            { value: "Correlation" },
            { value: gene },
          ],
        ],
      },
    ];
  }

  function exportSiteData() {
    const columns = [
      ...correlationColumns.slice(0, 1),
      {
        accessor: "firstPhospho",
        label: form.gene.label + " Phosphorylation Site",
        Header: (
          <OverlayTrigger
            overlay={<Tooltip id="site_correlation_phospho1">{form.gene.label} Phosphorylation Site</Tooltip>}>
            <b>{form.gene.label} Phospho. Site</b>
          </OverlayTrigger>
        ),
      },
      {
        accessor: "secondPhospho",
        label: form.correlatedGene.label + " Phosphorylation Site",
        Header: (
          <OverlayTrigger
            overlay={
              <Tooltip id="site_correlation_phospho2">{form.correlatedGene.label} Phosphorylation Site</Tooltip>
            }>
            <b>{form.correlatedGene.label} Phospho. Site</b>
          </OverlayTrigger>
        ),
      },
      ...correlationColumns.slice(1),
    ];

    return [
      {
        columns: columns.map((e) => {
          return { title: e.label, width: { wpx: 200 } };
        }),
        data: unfilteredSiteData.map((c) => {
          return [
            { value: c.name },
            { value: c.firstPhospho },
            { value: c.secondPhospho },
            { value: c.firstTumor },
            { value: c.firstTumorNum },
            { value: c.secondTumor },
            { value: c.secondTumorNum },
            { value: c.firstControl },
            { value: c.firstControlNum },
            { value: c.secondControl },
            { value: c.secondControlNum },
          ];
        }),
      },
    ];
  }

  function exportSite(data) {
    return [
      {
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
      },
    ];
  }

  return (
    <Tabs activeKey={tab} onSelect={(e) => setTab(e)} className="mb-3">
      {form.dataset.value === "proteinData" && (
        <Tab eventKey="summaryView" title="Summary">
          <Form.Group className="row mx-3 m-2" controlId="tumorView">
            { form.cancer.length > 1 ?
            <Form.Label className="col-xl-1 col-xs-12 col-form-label"  style={{ minWidth: "120px" }}>
              Tumor Type
            </Form.Label> : ''}
            { form.cancer.length > 1 ?  
            <div className="col-xl-5" style={{width:"35%"}}>
           <TypeDropdownCorrelation form={form} view={view} setView={setView} setLabel={setLabel}>  
           </TypeDropdownCorrelation>
            </div> : ''}
            <div className="p-3">
              <CorrelationToggleButton numType={numType} handleToggle={handleToggle}></CorrelationToggleButton>
            </div>
          </Form.Group>
          <Row className="mx-3 mt-3">
            <Col xl={12}>
              <Plot
                data={geneScatter}
                layout={{
                  ...defaultLayout,
                  title: `<b>${currentLabel} Protein Abundance ${firstGene} and ${secondGene} Correlation</b><br>(${
                    numType === "log2" ? "Log<sub>2</sub>" : "Converted Normal"
                  } Values)`,
                  autosize: true,
                  legend: {
                    orientation: "h",
                    y: -0.2,
                    x: 0.42,
                  },
                  annotations: [
                    {
                      text: proteinGeneCorrelation.length === 0 ? "No data available" : "",
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
                    filename: `${currentLabel ? currentLabel + "_" : ""}${datasetName}_Correlation-${form.gene.label}-${
                      form.correlatedGene.label
                    }`,
                  },
                }}
                useResizeHandler
                className="flex-fill w-100"
                style={{ height: "800px" }}
              />
            </Col>
          </Row>

          <fieldset className="mx-5 mb-3 border" style={{ color: "grey" }}>
            <Row>
              <div className="col-xl-4 my-2 d-flex justify-content-center">
                Tumor Correlation:{" "}
                {proteinGeneCorrelation.length
                  ? calculateCorrelation(
                      proteinGeneCorrelation.map((e) => (numType === "log2" ? e.firstTumor : e.firstTumorNum)),
                      proteinGeneCorrelation.map((e) => (numType === "log2" ? e.secondTumor : e.secondTumorNum)),
                      { decimals: 4 },
                    )
                  : "NA"}
              </div>
              <div className="col-xl-4 my-2 d-flex justify-content-center">
                Adj. Normal Correlation:{" "}
                {proteinGeneCorrelation.length
                  ? calculateCorrelation(
                      proteinGeneCorrelation.map((e) => (numType === "log2" ? e.firstControl : e.firstControlNum)),
                      proteinGeneCorrelation.map((e) => (numType === "log2" ? e.secondControl : e.secondControlNum)),
                      { decimals: 4 },
                    )
                  : "NA"}
              </div>

              <div className="col-xl-4 my-2 d-flex justify-content-center">
                Total Correlation:{" "}
                {proteinGeneCorrelation.filter(
                  (f) => f.firstTumor !== 0 && f.firstControl !== 0 && f.secondTumor !== 0 && f.secondControl !== 0,
                ).length
                  ? calculateCorrelation(
                      proteinGeneCorrelation
                        .filter(
                          (f) =>
                            f.firstTumor !== 0 && f.firstControl !== 0 && f.secondTumor !== 0 && f.secondControl !== 0,
                        )
                        .map((e) => (numType === "log2" ? e.firstControl : e.firstControlNum))
                        .concat(
                          proteinGeneCorrelation
                            .filter(
                              (f) =>
                                f.firstTumor !== 0 &&
                                f.firstControl !== 0 &&
                                f.secondTumor !== 0 &&
                                f.secondControl !== 0,
                            )
                            .map((e) => (numType === "log2" ? e.firstTumor : e.firstTumorNum)),
                        ),
                      proteinGeneCorrelation
                        .filter(
                          (f) =>
                            f.firstTumor !== 0 && f.firstControl !== 0 && f.secondTumor !== 0 && f.secondControl !== 0,
                        )
                        .map((e) => (numType === "log2" ? e.secondControl : e.secondControlNum))
                        .concat(
                          proteinGeneCorrelation
                            .filter(
                              (f) =>
                                f.firstTumor !== 0 &&
                                f.firstControl !== 0 &&
                                f.secondTumor !== 0 &&
                                f.secondControl !== 0,
                            )
                            .map((e) => (numType === "log2" ? e.secondTumor : e.secondTumorNum)),
                        ),
                      { decimals: 4 },
                    )
                  : "NA"}
              </div>
            </Row>
          </fieldset>

          {form.cancer.find((e) => e.value === currentTumor[0]).singlePool === 1 && (
            <div className="mx-5" style={{ color: "grey" }}>
              Note: {form.cancer.find((e) => e.value === currentTumor[0]).label} is a single pool type tumor set
            </div>
          )}

          <div className="m-3">
            <div className="d-flex" style={{ justifyContent: "flex-end" }}>
              <ExcelFile
                filename={`${currentLabel ? currentLabel + "_" : ""}${datasetName}_Correlation-${form.gene.label}-${
                  form.correlatedGene.label
                }`}
                element={<a href="javascript:void(0)">Export Data</a>}>
                <ExcelSheet dataSet={exportSummarySettings()} name="Input Configuration" />
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
      )}

      {form.dataset.value !== "proteinData" && (
        <Tab eventKey="summaryView" title="Summary">
          <Form.Group className="m-3 row" controlId="siteTumor">
            <Form.Label className="col-xl-1 col-xs-12 col-form-label" style={{ minWidth: "120px" }}>
              Tumor Type
            </Form.Label>
            <div className="col-xl-5" style={{width: "36%"}}>
              <Select
                name="siteTumor"
                value={
                  form.cancer.find((e) => e.value === siteTumor.value)
                    ? siteTumor
                    : {
                        label: form.cancer[0].label,
                        value: form.cancer[0].value,
                      }
                }
                options={form.cancer}
                onChange={(e) => {
                  setSiteTumor(e);
                  setLabel(form.cancer.find((d) => d.value === e.value).label);
                }}
              />
              </div>
          </Form.Group>
          <div className="m-3">
            <div className="row">
              <b className="col-xl-11" style={{ textAlign: "center" }}>
                Phosphorylation Site - {form.gene.label}
              </b>
            </div>
            <Table
              columns={siteColumns}
              defaultSort={[{ id: "phosphorylationSite", asec: true }]}
              data={results[0].summary.records
                .filter((f) => f.cancerId === currentSiteTumor && f.phosphorylationSite !== "all")
                .map((c) => {
                  return {
                    phosphorylationSite: c.phosphorylationSite,
                    accession: c.accession,
                    phosphopeptide: c.phosphopeptide,
                    tumorSampleCount: c.tumorSampleCount ? c.tumorSampleCount : "NA",
                    normalSampleCount: c.normalSampleCount ? c.normalSampleCount : "NA",
                  };
                })}
            />
          </div>

          <div className="m-3">
            <div className="row">
              <b className="col-xl-11" style={{ textAlign: "center" }}>
                Phosphorylation Site - {form.correlatedGene.label}
              </b>
            </div>
            <Table
              columns={siteColumns}
              defaultSort={[{ id: "phosphorylationSite", asec: true }]}
              data={results[1].summary.records
                .filter((f) => f.cancerId === currentSiteTumor && f.phosphorylationSite !== "all")
                .map((c) => {
                  return {
                    phosphorylationSite: c.phosphorylationSite,
                    accession: c.accession,
                    phosphopeptide: c.phosphopeptide,
                    tumorSampleCount: c.tumorSampleCount ? c.tumorSampleCount : "NA",
                    normalSampleCount: c.normalSampleCount ? c.normalSampleCount : "NA",
                  };
                })}
            />
          </div>
        </Tab>
      )}

      {(form.dataset.value === "phosphoproteinData" || form.dataset.value === "phosphoproteinRatioData") && (
        <Tab eventKey="siteView" title="Phosphorylation Site">
          <Row className="m-1">
             <Form.Group className="col-xl-4 col-md-3"  style={{width:"35%"}} controlId="site1" >
             <Form.Label className="required " style={{ whiteSpace: "nowrap ",minWidth: "120px" }}>
              Tumor Type
            </Form.Label>
            <div className="col-xl-12">
              <Select
                name="siteTumor"
                value={
                  form.cancer.find((e) => e.value === siteTumor.value)
                    ? siteTumor
                    : {
                        label: form.cancer[0].label,
                        value: form.cancer[0].value,
                      }
                }
                options={form.cancer}
                onChange={(e) => {
                  setSiteTumor(e);
                  setLabel(form.cancer.find((d) => d.value === e.value).label);
                }}
              />
              </div>
         </Form.Group>
            <Form.Group className="col-xl-3 col-md-3" controlId="site1">
              <Form.Label className="required" style={{ whiteSpace: "nowrap " }}>
                {firstGene} Phosphorylation Site
              </Form.Label>
              <Select
                name="firstSite"
                value={firstSite}
                options={firstSites}
                onChange={(e) => {
                  setFirstSite(e);
                }}
              />
            </Form.Group>
            <Form.Group className="col-md-3" controlId="site2">
              <Form.Label className="required" style={{ whiteSpace: "nowrap " }}>
                {secondGene} Phosphorylation Site or Protein
              </Form.Label>
              <Select
                name="secondSite"
                value={secondSite}
                options={secondSites}
                onChange={(e) => {
                  setSecondSite(e);
                }}
              />
            </Form.Group>
             </Row>
          <Row className="m-1">
            <Form.Group className="col-xl-12 col-md-12 col-form-label p-2">    
              <CorrelationToggleButton numType={numType} handleToggle={handleToggle}></CorrelationToggleButton>
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
                      ? `<b>${currentLabel} ${form.gene.label}_${firstSite.value} and ${form.correlatedGene.label}_${
                          secondSite.value === form.correlatedGene.label ? "Protein" : secondSite.value
                        } Correlation</b><br>(${numType === "log2" ? "Log<sub>2</sub>" : "Converted Normal"} Values)`
                      : "",
                  autosize: true,
                  legend: {
                    orientation: "h",
                    y: -0.2,
                    x: 0.42,
                  },
                  xaxis: {
                    title: `<b>${form.gene.label}${firstSite.value ? `_${firstSite.value}` : ""}${
                      form.dataset.value === "phosphoproteinRatioData" ? "/Protein Level" : ""
                    } ${siteTumor.singlePool === 1 ? "Tumor/Normal" : ""}</b>`,
                    zeroline: false,
                    titlefont: {
                      size: 16,
                    },
                  },
                  yaxis: {
                    title: `<b>${form.correlatedGene.label}${
                      secondSite.value === form.correlatedGene.label ? "" : `_${secondSite.value}`
                    }${
                      form.dataset.value === "phosphoproteinRatioData" && secondSite.value !== form.correlatedGene.label
                        ? "/Protein Level"
                        : ""
                    } ${siteTumor.singlePool === 1 ? "Tumor/Normal" : ""}</b>`,
                    zeroline: false,
                    titlefont: {
                      size: 16,
                    },
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
                config={{
                  ...defaultConfig,
                  toImageButtonOptions: {
                    ...defaultConfig.toImageButtonOptions,
                    filename: `${currentLabel}_${datasetName}_Correlation-${firstSite.label}-${secondSite.label}`,
                  },
                }}
                useResizeHandler
                className="flex-fill w-100"
                style={{ height: "800px" }}
              />
            </Col>
          </Row>

          <fieldset className="mx-5 mb-3 border" style={{ color: "grey" }}>
            <Row>
              <div className="col-xl-4 my-2 d-flex justify-content-center">
                Tumor Correlation:{" "}
                {unfilteredSiteData.filter((f) => f.firstTumor !== "NA" && f.secondTumor !== "NA").length
                  ? calculateCorrelation(
                      unfilteredSiteData
                        .filter((f) => f.firstTumor !== "NA" && f.secondTumor !== "NA")
                        .map((e) => (numType === "log2" ? e.firstTumor : e.firstTumorNum)),
                      unfilteredSiteData
                        .filter((f) => f.firstTumor !== "NA" && f.secondTumor !== "NA")
                        .map((e) => (numType === "log2" ? e.secondTumor : e.secondTumorNum)),
                      { decimals: 4 },
                    )
                  : "NA"}
              </div>
              <div className="col-xl-4 my-2 d-flex justify-content-center">
                Adj. Normal Correlation:{" "}
                {unfilteredSiteData.filter(
                  (f) =>
                    f.firstControl !== "NA" &&
                    f.secondControl !== "NA" &&
                    f.firstControl !== 0 &&
                    f.secondControl !== 0,
                ).length
                  ? calculateCorrelation(
                      unfilteredSiteData
                        .filter(
                          (f) =>
                            f.firstControl !== "NA" &&
                            f.secondControl !== "NA" &&
                            f.firstControl !== 0 &&
                            f.secondControl !== 0,
                        )
                        .map((e) => (numType === "log2" ? e.firstControl : e.firstControlNum)),
                      unfilteredSiteData
                        .filter(
                          (f) =>
                            f.firstControl !== "NA" &&
                            f.secondControl !== "NA" &&
                            f.firstControl !== 0 &&
                            f.secondControl !== 0,
                        )
                        .map((e) => (numType === "log2" ? e.secondControl : e.secondControlNum)),
                      { decimals: 4 },
                    )
                  : "NA"}
              </div>

              <div className="col-xl-4 my-2 d-flex justify-content-center">
                Total Correlation:{" "}
                {siteData.filter(
                  (f) => f.firstTumor !== 0 && f.firstControl !== 0 && f.secondTumor !== 0 && f.secondControl !== 0,
                ).length
                  ? calculateCorrelation(
                      unfilteredSiteData
                        .filter(
                          (f) =>
                            f.firstControl !== "NA" &&
                            f.secondControl !== "NA" &&
                            f.firstControl !== 0 &&
                            f.secondControl !== 0,
                        )
                        .map((e) => (numType === "log2" ? e.firstControl : e.firstControlNum))
                        .concat(
                          unfilteredSiteData
                            .filter(
                              (f) =>
                                f.firstTumor !== "NA" &&
                                f.secondTumor !== "NA" &&
                                f.firstControl !== 0 &&
                                f.secondControl !== 0,
                            )
                            .map((e) => (numType === "log2" ? e.firstTumor : e.firstTumorNum)),
                        ),
                      unfilteredSiteData
                        .filter(
                          (f) =>
                            f.firstControl !== "NA" &&
                            f.secondControl !== "NA" &&
                            f.firstControl !== 0 &&
                            f.secondControl !== 0,
                        )
                        .map((e) => (numType === "log2" ? e.secondControl : e.secondControlNum))
                        .concat(
                          unfilteredSiteData
                            .filter(
                              (f) =>
                                f.firstTumor !== "NA" &&
                                f.secondTumor !== "NA" &&
                                f.firstControl !== 0 &&
                                f.secondControl !== 0,
                            )
                            .map((e) => (numType === "log2" ? e.secondTumor : e.secondTumorNum)),
                        ),
                      { decimals: 4 },
                    )
                  : "NA"}
              </div>
            </Row>
          </fieldset>
          {siteTumor.singlePool === 1 && (
            <div className="mx-5" style={{ color: "grey" }}>
              Note: {siteTumor.label} is a single pool type tumor set
            </div>
          )}
          <div className="m-3">
            <div className="row">
              <div className="col d-flex" style={{ justifyContent: "flex-end" }}>
                <ExcelFile
                  filename={`${currentLabel}_${datasetName}_Correlation-${firstSite.label}-${secondSite.label}`}
                  element={<a href="javascript:void(0)">Export Data</a>}>
                  <ExcelSheet dataSet={exportSummarySettings()} name="Input Configuration" />
                  <ExcelSheet dataSet={exportSiteData()} name="Site Data" />
                </ExcelFile>
              </div>
            </div>

            <Table
              columns={[
                ...correlationColumns.slice(0, 1),
                {
                  accessor: "firstPhospho",
                  label: form.gene.label + "Phosphorylation Site",
                  Header: (
                    <OverlayTrigger
                      overlay={
                        <Tooltip id="site_correlation_phospho1">{form.gene.label} Phosphorylation Site</Tooltip>
                      }>
                      <b>{form.gene.label} Phospho. Site</b>
                    </OverlayTrigger>
                  ),
                },
                {
                  accessor: "secondPhospho",
                  label: form.correlatedGene.label + "Phosphorylation Site",
                  Header: (
                    <OverlayTrigger
                      overlay={
                        <Tooltip id="site_correlation_phospho2">
                          {form.correlatedGene.label} Phosphorylation Site
                        </Tooltip>
                      }>
                      <b>{form.correlatedGene.label} Phospho. Site</b>
                    </OverlayTrigger>
                  ),
                },
                ...correlationColumns.slice(1),
              ]}
              defaultSort={[{ id: "name", asec: true }]}
              data={unfilteredSiteData.map((c) => {
                return {
                  name: c.name,
                  firstPhospho: c.firstPhospho,
                  secondPhospho: c.secondPhospho,
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
      )}
    </Tabs>
  );
}
