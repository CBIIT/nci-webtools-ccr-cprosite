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

import { useEffect, useState } from "react";
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


  //if (view.length>1) setView(tumors)
  //have to update the view value if form value changes
  //useEffect(()=>{setView(tumors);console.log("this view in effect",view)},[])
  //console.log(view, tumors)

  const [siteTumor, setSiteTumor] = useState({
    value: form.cancer[0].value,
    label: form.cancer[0].label,
  });
  const [label, setLabel] = useState(form.cancer[0].label);
  const [tab, setTab] = useState("summaryView");

  const getNumericPosition = (site) => +String(site).match(/\d+/g)[0] || 0;

  const datasetName =
    form.dataset.value === "proteinData" ? "Protein_Abundance" :
    form.dataset.label === "RNA Level" ? "RNA_Protein" :
    form.dataset.value === "phosphoproteinData" ? "Phosphorylation_Site" :
    form.dataset.value === "phosphoproteinRatioData" ? "Phosphorylation_Protein" :
    form.dataset.value === "proteinData" && (form.correlation === "proteinMRNA" || form.correlation === "toAnotherProtein") ? "Protein" :
    form.dataset.value === "rnaLevel" && (form.correlation === "proteinMRNA" || form.correlation === "toAnotherProtein") ? "RNA_Protein" :  "Phosphorylation_Protein";

  const analysisName = 
  form.analysis.value === "correlation" ? "Correlation": "Tumor_vs_Normal"

  const dataSetCorrelation = form.analysis.value === "correlation" && form.dataset.value === "proteinData" ? "RNA Protein" :
    form.analysis.value === "correlation" && form.dataset.value === "rnaLevel" ? "RNA Level" :
    form.analysis.value === "correlation" && form.dataset.value === "phosphoproteinData" ? "Phosphoylation Protein" : "Phosphorylation Site"

  //adjust label if it is brain, since the dropdown will not contains brain
  //view.length>1? setView(tumors):''
  const currentTumor = view.length > 1 ? form.cancer.map((e) => e.value) : form.cancer.find((e) => e.value === view[0]) ? view : form.cancer.map((e) => e.value);
  const currentSiteTumor = form.cancer.find((e) => e.value === siteTumor.value)
    ? siteTumor.value
    : form.cancer[0].value;

  
  const currentLabel =
    currentTumor.length > 1 ? "" : form.cancer.find((e) => e.value === view[0]) ? label : form.cancer[0].label;
  // form.dataset.label === "Relative Protein Abundance" && (tumors.length > 1 && label === "All Selected Tumor Type")
  //   ? ""
  //   : form.cancer.find((e) => e.value === siteTumor.value)
  //   ? label
  //   : form.cancer[0].label;
  //console.log(label,currentLabel,tumors)

  console.log("form", form);

  let hasValueID12; 
  if ((form.dataset.value === "proteinData" && currentTumor.includes(12)) || (form.dataset.value === "phosphoproteinData" && currentSiteTumor == 12) || (form.dataset.value ==="phosphoproteinRatioData" && currentSiteTumor == 12)) {
    hasValueID12 = true;
  } else { hasValueID12 = false; }

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
      accessor: "cancer",
      id: "cancer",
      label: "cancer",
      Header: (
          <OverlayTrigger overlay={<Tooltip id="protein_correlation_tumor">Tumor Type</Tooltip>}>
              <b>Tumor Type</b>
          </OverlayTrigger>
      ),
  },
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
      label: hasValueID12 ? `${firstGene} Adjacent Normal Log2` : `${firstGene} Normal Log2` ,
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="first_correlation_control_log2">
              ${firstGene} {hasValueID12 ? "" : "Adjacent"} Normal Log<sub>2</sub>
            </Tooltip>
          }>
          {hasValueID12 ?
            <b>
              {firstGene} Normal Log<sub>2</sub>
            </b> : <b>
              {firstGene} Adj. Normal Log<sub>2</sub>
            </b>
          }
        </OverlayTrigger>
      ),
    },
    {
      accessor: "firstControlNum",
      label: hasValueID12 ? `${firstGene} Normal Abundance` :`${firstGene} Adjacent Normal Abundance`,
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="protein_correlation_control_num">{firstGene} {hasValueID12 ? "" : "Adjacent"} Normal Abundance</Tooltip>}>
          {hasValueID12 ? <b>{firstGene} Normal Abundance</b> : <b>{firstGene} Adj. Normal Abundance</b>}
        </OverlayTrigger>
      ),
    },
    {
      accessor: "secondControl",
      label: hasValueID12 ? `${secondGene} Normal Log2` :`${secondGene} Adjacent Normal Log2`,
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="second_control_log2">
              {secondGene} {hasValueID12 ? "" : "Adjacent"} Normal Log<sub>2</sub>
            </Tooltip>
          }>{hasValueID12 ?
            <b>
              {secondGene} Normal Log<sub>2</sub>
            </b> : <b>
              {secondGene} Adj. Normal Log<sub>2</sub>
            </b>}
        </OverlayTrigger>
      ),
    },
    {
      accessor: "secondControlNum",
      label: hasValueID12 ? `${secondGene} Normal Abundance` : `${secondGene} Adjacent Normal Abundance`,
      Header: (
        <OverlayTrigger overlay={<Tooltip id="second_control_num">{secondGene} {hasValueID12 ? "" : "Adjacent"} Normal Abundance</Tooltip>}>
          {hasValueID12 ? <b>{secondGene} Normal Abundance</b> : <b>{secondGene} Adj. Normal Abundance</b>}
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
      label: hasValueID12 ? "Normal Count" : "Adjacent Normal Count",
      Header: (
        <OverlayTrigger overlay={<Tooltip id="site_correlation_peptide">{hasValueID12 ? "" : "Adjacent "}Normal Sample Number</Tooltip>}>
          {hasValueID12 ? <b>Normal Count</b>: <b>Adj. Normal Count</b>}
        </OverlayTrigger>
      ),
    },
  ];
  //filter out brain data to display in tabel
  // const firstFilteredSet = tumors.length > 1 
  //       ?  firstGeneSet.filter((f) => currentTumor.includes(f.cancerId) && f.cancerId !=12)
  //       :  firstGeneSet.filter((f) => currentTumor.includes(f.cancerId));
  // const secondFilteredSet =  tumors.length > 1 
  //       ? secondGeneSet.filter((f) => currentTumor.includes(f.cancerId) && f.cancerId !=12)
  //       : secondGeneSet.filter((f) => currentTumor.includes(f.cancerId));
  //Organize datasets (unfiltered)
  const firstFilteredSet = firstGeneSet.filter((f) => currentTumor.includes(f.cancerId));
  const secondFilteredSet = secondGeneSet.filter((f) => currentTumor.includes(f.cancerId));
  const getData = firstFilteredSet.map((first) => {
    const second = secondFilteredSet.find((d) => {
      return first.participantId === d.participantId && first.phosphorylationSite === d.phosphorylationSite;
    });
    const cancerLabel = form.cancer.find(e => e.value==first.cancerId)
    if (second) {
      return {
        cancer: cancerLabel? cancerLabel.label:"",
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

  // const proteinGeneCorrelation = proteinGene.filter(
  //   (e) => e.firstTumor !== "NA" && e.firstControl !== "NA" && e.secondTumor !== "NA" && e.secondControl !== "NA",
  // );

   const proteinGeneCorrelation = proteinGene.filter(
    (e) => e.firstTumor !== "NA"  && e.secondTumor !== "NA",
  );
  function getSite() {
    const currentTumor = form.cancer.find((e) => e.value === siteTumor.value) ? siteTumor.value : form.cancer[0].value;
    const currentTumorName = form.cancer.find((e) => e.value === siteTumor.value) ? siteTumor.label : form.cancer[0].label;
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
            cancer: currentTumorName,
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

  const secondSiteLabel = secondSite.value === form.correlatedGene.label ? " (Protein)" : "_" + secondSite.label;

  let filenamePhos; 
  if (currentLabel ) {
    if (Object.keys(firstSite).length && firstSite.value !== '' && firstSite.label !== '' && firstSite.value !== "undefined" && firstSite.label !== "undefined") {
      filenamePhos = `${currentLabel}_${datasetName}_${analysisName}-${form.gene.label}_${firstSite.label}-${form.correlatedGene.label}${secondSiteLabel}`;
    } else {
      filenamePhos = `${currentLabel}_${datasetName}_${analysisName}-${form.gene.label}-${form.correlatedGene.label}${secondSiteLabel}`;
   }
    
  } else if (siteTumor) {
    if (Object.keys(firstSite).length && firstSite.value !== '' && firstSite.label !== '' && firstSite.value !== "undefined" && firstSite.label !== "undefined") {
      filenamePhos = `${siteTumor.label}_${datasetName}_${analysisName}-${form.gene.label}_${firstSite.label}-${form.correlatedGene.label}${secondSiteLabel}` 
    } else {
      filenamePhos = `${siteTumor.label}_${datasetName}_${analysisName}-${form.gene.label}-${form.correlatedGene.label}${secondSiteLabel}` 
    }
    
  } else {
    if (Object.keys(firstSite).length && firstSite.value !== '' && firstSite.label !== '' && firstSite.value !== "undefined" && firstSite.label !== "undefined") {
      filenamePhos = `${datasetName}_${analysisName}-${form.gene.label}_${firstSite.label}-${form.correlatedGene.label}${secondSiteLabel}` 
    } else {
      filenamePhos = `${datasetName}_${analysisName}-${form.gene.label}-${form.correlatedGene.label}${secondSiteLabel}` 
    }
    
  }
   

  const defaultLayout = {
    xaxis: {
      title: `<b>${firstGene} ${form.cancer.find((e) => e.value === currentTumor[0]).singlePool === 1 ? "Tumor/Normal" : ""
        }</b>`,
      zeroline: false,
      titlefont: {
        size: 16,
      },
    },
    yaxis: {
      title: `<b>${secondGene} ${form.cancer.find((e) => e.value === currentTumor[0]).singlePool === 1 ? "Tumor/Normal" : ""
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
      //customdata: proteinGeneCorrelation.map((e) => e.cancer),
      customdata: proteinGeneCorrelation.map((e) => ({ cancer: e.cancer, name: e.name })),
      mode: "markers",
      type: "scatter",
      name: "Tumor",
      text: proteinGeneCorrelation.map((e) => e.name),
      hovertemplate:
      `Tumor Type: %{customdata.cancer}<br>`+
        `Patient ID: %{text}<br>${firstGene} Tumor ${numType === "log2" ? "Log2" : "Abundance"}: %{x}<br>` +
        `${secondGene} Tumor ${numType === "log2" ? "Log2" : "Abundance"}: %{y}<extra></extra>`,
    },
    {
      x: proteinGeneCorrelation
        .filter((f) => f.firstControl !== 0 && f.secondControl !== 0 && f.firstControl !== 'NA' && f.secondControl !== 'NA')
        .map((e) => (numType === "log2" ? e.firstControl : e.firstControlNum)),
      y: proteinGeneCorrelation
        .filter((f) => f.firstControl !== 0 && f.secondControl !== 0 && f.firstControl !== 'NA' && f.secondControl !== 'NA')
        .map((e) => (numType === "log2" ? e.secondControl : e.secondControlNum)),
      marker: {
        size: 8,
        color: "rgb(31,119,180)",
      },
      mode: "markers",
      type: "scatter",
      name: hasValueID12 ? "Normal" : "Adjacent Normal",
      text: proteinGeneCorrelation.map((e) => e.name),
      //customdata: proteinGeneCorrelation.map((e) => e.cancer),
      customdata: proteinGeneCorrelation.map((e) => ({ cancer: e.cancer, name: e.name })),
      hovertemplate:
      `Tumor Type: %{customdata.cancer}<br>`+
        `Patient ID: %{text}<br>${firstGene} Control ${numType === "log2" ? "Log2" : "Abundance"}: %{x}<br>` +
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
      text: siteData.map((e) => e.name),
      customdata: siteData.map((e) => ({ cancer: e.cancer, name: e.name })),
      hovertemplate:
      `Tumor Type: %{customdata.cancer}<br>`+
        `Patient ID: %{customdata.name}<br>${firstGene} Tumor ${numType === "log2" ? "Log2" : "Abundance"}: %{x}<br>` +
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
      name: hasValueID12 ? "Normal" : "Adjacent Normal",
      text: siteData.map((e) => e.name),
      //customdata: siteData.map((e) => e.cancer),
      customdata: siteData.map((e) => ({ cancer: e.cancer, name: e.name })),
      hovertemplate:
      `Tumor Type: %{customdata.cancer}<br>`+
        `Patient ID: %{text}<br>${firstGene} Control ${numType === "log2" ? "Log2" : "Abundance"}: %{x}<br>` +
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
      data: proteinGene.filter(c => c.name).map((e) => {
        return [
          {value: e.cancer},
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
      ...correlationColumns.slice(0, 2),
     {
        accessor: "firstPhospho",
        //label: form.gene.label + " Phosphorylation Site",
        label: form.gene.label + " " + dataSetCorrelation,
        Header: (
          <OverlayTrigger
            // overlay={<Tooltip id="site_correlation_phospho1">{form.gene.label} Phosphorylation Site</Tooltip>}>
            overlay={<Tooltip id="site_correlation_phospho1">{form.gene.label} {dataSetCorrelation}</Tooltip>}>
            {/* <b>{form.gene.label} Phospho. Site</b> */}
            <b>{form.gene.label} {dataSetCorrelation}</b>
          </OverlayTrigger>
        ),
      },
      {
        accessor: "secondPhospho",
        //label: form.correlatedGene.label + " Phosphorylation Site",
        label: form.correlatedGene.label + " " + dataSetCorrelation,
        Header: (
          <OverlayTrigger
            // overlay={
            //   <Tooltip id="site_correlation_phospho2">{form.correlatedGene.label} Phosphorylation Site</Tooltip>
            overlay={
              <Tooltip id="site_correlation_phospho2">{form.correlatedGene.label} {dataSetCorrelation}</Tooltip>
            }>
            {/* <b>{form.correlatedGene.label} Phospho. Site</b> */}
            <b>{form.correlatedGene.label}  {dataSetCorrelation}</b>
          </OverlayTrigger>
        ),
      },
      ...correlationColumns.slice(2),
    ];

    return [
      {
        columns: columns.map((e) => {
          return { title: e.label, width: { wpx: 200 } };
        }),
        data: unfilteredSiteData.map((c) => {
          return [
            {value: c.cancer},
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
            {form.cancer.length > 1 ?
              <Form.Label className="col-xl-1 col-xs-12 col-form-label" style={{ minWidth: "120px" }}>
                Tumor Type
              </Form.Label> : ''}
            {form.cancer.length > 1 ?
              <div className="col-xl-7">
                <TypeDropdownCorrelation form={form} view={view} setView={setView} setLabel={setLabel} >
                </TypeDropdownCorrelation>
              </div> : ''}
            <div className="p-3">
              <CorrelationToggleButton numType={numType} handleToggle={handleToggle} currentTumor={currentSiteTumor}></CorrelationToggleButton>
            </div>
          </Form.Group>
          <Row className="mx-3 mt-3">
            <Col xl={12}>
              <Plot
                data={geneScatter}
                layout={{
                  ...defaultLayout,
                  title: `<b> Protein Abundance ${firstGene} and ${secondGene} Correlation</b><br>(${numType === "log2" ? "Log<sub>2</sub>" : "Converted Normal"
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
                    filename: `${currentLabel ? currentLabel + "_" : ""}${datasetName}_Correlation-${form.gene.label}-${form.correlatedGene.label
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
                    ? (() => {
                        const firstTumorData = proteinGeneCorrelation.filter((f) => f.firstTumor !== "NA" && f.firstTumorNum !== "NA").map((e) =>
                          numType === "log2" ? e.firstTumor : e.firstTumorNum
                        );
                        const secondTumorData = proteinGeneCorrelation.filter((f) => f.secondTumor !== "NA" && f.secondTumorNum !== "NA").map((e) =>
                          numType === "log2" ? e.secondTumor : e.secondTumorNum
                        );
                        if (!firstTumorData.every((value) => typeof value === "number") || !secondTumorData.every((value) => typeof value === "number") || firstTumorData.length !== secondTumorData.length) {
                          return "NA";
                        }
                        const result = calculateCorrelation(firstTumorData, secondTumorData, {
                          decimals: 4,
                        });
                        return isNaN(result) ? "NA" : result.toFixed(4);
                      })()
                    : "NA"}
              </div>
              <div className="col-xl-4 my-2 d-flex justify-content-center">
              {hasValueID12 ? "Normal Correlation: " : "Adj. Normal Correlation: "}
                  {proteinGeneCorrelation.length
                    ? (() => {
                        const firstControlData = proteinGeneCorrelation.filter(
                          (f) =>
                            f.firstControl !== "NA" &&
                            f.firstControlNum !== "NA" &&
                            f.secondControlNum !== "NA" &&
                            f.secondControl !== "NA"
                        ).map((e) =>
                          numType === "log2" ? e.firstControl : e.firstControlNum
                        );
                        const secondControlData = proteinGeneCorrelation.filter(
                        (f) =>
                          f.firstControl !== "NA" &&
                          f.firstControlNum !== "NA" &&
                          f.secondControlNum !== "NA" &&
                          f.secondControl !== "NA"
                         
                      ).map((e) =>
                          numType === "log2" ? e.secondControl : e.secondControlNum
                        );
                    
                  
                       // Create new arrays without null values
                      const filteredFirstControlData = [];
                      const filteredSecondControlData = [];

                      for (let i = 0; i < firstControlData.length; i++) {
                        if (firstControlData[i] !== null && firstControlData[i] !== -Infinity && secondControlData[i] !== null && secondControlData[i] !== -Infinity) {
                          filteredFirstControlData.push(firstControlData[i]);
                          filteredSecondControlData.push(secondControlData[i]);
                        }
                      }

                        if (filteredFirstControlData.length === 0 || filteredSecondControlData.length === 0 || !filteredFirstControlData.every((value) => typeof value === "number") || !filteredSecondControlData.every((value) => typeof value === "number")) {
                          return "NA";
                        }
                        const result = calculateCorrelation(
                          filteredFirstControlData,
                          filteredSecondControlData,
                          { decimals: 4 }
                        );
                        return isNaN(result) ? "NA" : result.toFixed(4);
                      })()
                    : "NA"}
              </div>

              <div className="col-xl-4 my-2 d-flex justify-content-center">
                Total Correlation:{" "}
                {proteinGeneCorrelation.length
                  ? (() => {
                      const firstControlData = proteinGeneCorrelation
                      .filter(
                        (f) =>
                          f.firstControl !== "NA" &&
                          f.firstControlNum !== "NA" &&
                          f.secondControl !== "NA" &&
                          f.secondControlNum !== "NA"
                      )
                        .map((e) =>
                          numType === "log2" ? e.firstControl : e.firstControlNum
                        );
                      const firstTumorData = proteinGeneCorrelation
                        .filter(
                          (f) =>
                          f.firstTumor !== "NA" &&
                          f.firstTumorNum !== "NA" &&
                          f.secondTumor !== "NA" &&
                          f.secondTumorNum !== "NA"
                        )
                        .map((e) => (numType === "log2" ? e.firstTumor : e.firstTumorNum));
                      const secondControlData = proteinGeneCorrelation
                        .filter(
                          (f) =>
                          f.firstControl !== "NA" &&
                          f.firstControlNum !== "NA" &&
                          f.secondControl !== "NA" &&
                          f.secondControlNum !== "NA"
                        )
                        .map((e) =>
                          numType === "log2" ? e.secondControl : e.secondControlNum
                        );
                      const secondTumorData = proteinGeneCorrelation
                        .filter(
                          (f) =>
                          f.firstTumor !== "NA" &&
                          f.firstTumorNum !== "NA" &&
                          f.secondTumor !== "NA" &&
                          f.secondTumorNum !== "NA"
                        )
                        .map((e) => (numType === "log2" ? e.secondTumor : e.secondTumorNum));

                    if (
                        !firstControlData.every((value) => typeof value === "number") ||
                        !firstTumorData.every((value) => typeof value === "number") ||
                        !secondControlData.every((value) => typeof value === "number") ||
                        !secondTumorData.every((value) => typeof value === "number")
                      ) {
                        return "NA";
                    }
                    
                    // Create new arrays without null values
                    const filteredFirstData = [];
                    const filteredSecondData = [];

                    for (let i = 0; i < firstControlData.concat(firstTumorData).length; i++) {
                      if (firstControlData.concat(firstTumorData)[i] !== null && firstControlData.concat(firstTumorData)[i] !== -Infinity && secondControlData.concat(secondTumorData)[i] !== null && secondControlData.concat(secondTumorData)[i] !== -Infinity) {
                        filteredFirstData.push(firstControlData.concat(firstTumorData)[i]);
                        filteredSecondData.push(secondControlData.concat(secondTumorData)[i]);
                      }
                    }

                      const result = calculateCorrelation(
                        filteredFirstData,
                        filteredSecondData,
                        { decimals: 4 }
                      );
                      return isNaN(result) ? "NA" : result.toFixed(4);
                    
                    })()
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
                filename={`${currentLabel ? currentLabel + "_" : ""}${datasetName}_Correlation-${form.gene.label}-${form.correlatedGene.label
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
                  cancer: c.cancer,
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
            <div className="col-xl-5" style={{ width: "36%" }}>
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
                options={[...form.cancer].sort((a, b) => (a.label > b.label) ? 1 : -1)}
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
              <Form.Group className="col-xxl-4 col-xl-12 col-lg-4 col-md-12 col-sm-12" controlId="site1" >
                <Form.Label className="required " style={{ whiteSpace: "nowrap ", minWidth: "120px" }}>
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
                    options={[...form.cancer].sort((a, b) => (a.label > b.label) ? 1 : -1)}
                    onChange={(e) => {
                      setSiteTumor(e);
                      setLabel(form.cancer.find((d) => d.value === e.value).label);
                    }}
                  />
                </div>
              </Form.Group>
              <Form.Group className="col-xxl-3 col-xl-6 col-lg-3 col-md-12 col-sm-12 header-padding" controlId="site1">
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
              <Form.Group className="col-xxl-4 col-xl-6 col-lg-4 col-md-12 col-sm-12 header-padding" controlId="site2">
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
            <Form.Group className="col-xxl-12 col-xl-12 col-md-12 col-form-label p-2">
              <CorrelationToggleButton numType={numType} handleToggle={handleToggle} currentTumor={currentSiteTumor}></CorrelationToggleButton>
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
                      ? `<b>${currentLabel} ${form.gene.label}_${firstSite.value} and ${form.correlatedGene.label}_${secondSite.value === form.correlatedGene.label ? "Protein" : secondSite.value
                      } Correlation</b><br>(${numType === "log2" ? "Log<sub>2</sub>" : "Converted Normal"} Values)`
                      : "",
                  autosize: true,
                  legend: {
                    orientation: "h",
                    y: -0.2,
                    x: 0.42,
                  },
                  xaxis: {
                    title: `<b>${form.gene.label}${firstSite.value ? `_${firstSite.value}` : ""}${form.dataset.value === "phosphoproteinRatioData" ? "/Protein Level" : ""
                      } ${siteTumor.singlePool === 1 ? "Tumor/Normal" : ""}</b>`,
                    zeroline: false,
                    titlefont: {
                      size: 16,
                    },
                  },
                  yaxis: {
                    title: `<b>${form.correlatedGene.label}${secondSite.value === form.correlatedGene.label ? "" : `_${secondSite.value}`
                      }${form.dataset.value === "phosphoproteinRatioData" && secondSite.value !== form.correlatedGene.label
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
                    filename: `${currentLabel ? `${currentLabel}_` : ''}${datasetName}_Correlation-${firstSite.label}-${secondSite.label}`,
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
                  {unfilteredSiteData.length
                    ? (() => {
                        const firstTumorData = unfilteredSiteData.filter((f) => f.firstTumor !== "NA" && f.firstTumorNum !== "NA").map((e) =>
                          numType === "log2" ? e.firstTumor : e.firstTumorNum
                        );
                        const secondTumorData = unfilteredSiteData.filter((f) => f.secondTumor !== "NA" && f.secondTumorNum !== "NA").map((e) =>
                          numType === "log2" ? e.secondTumor : e.secondTumorNum
                        );

                        if (!firstTumorData.every((value) => typeof value === "number") || !secondTumorData.every((value) => typeof value === "number") || firstTumorData.length !== secondTumorData.length) {
                          return "NA";
                        }
                        const result = calculateCorrelation(firstTumorData, secondTumorData, {
                          decimals: 4,
                        });
                    
                        return isNaN(result) ? "NA" : result.toFixed(4);
                      })()
                    : "NA"}
              </div>
              <div className="col-xl-4 my-2 d-flex justify-content-center">
              {hasValueID12 ? "Normal Correlation: " : "Adj. Normal Correlation: "}
                  {unfilteredSiteData.length
                  ? (() => {
                        const firstControlData = unfilteredSiteData.filter(
                          (f) =>
                            f.firstControl !== "NA" &&
                            f.firstControlNum !== "NA" &&
                            f.secondControlNum !== "NA" &&
                            f.secondControl !== "NA"
                        ).map((e) =>
                          numType === "log2" ? e.firstControl : e.firstControlNum
                        );
                        const secondControlData = unfilteredSiteData.filter(
                        (f) =>
                            f.firstControl !== "NA" &&
                            f.firstControlNum !== "NA" &&
                            f.secondControlNum !== "NA" &&
                            f.secondControl !== "NA"
                         
                      ).map((e) =>
                          numType === "log2" ? e.secondControl : e.secondControlNum
                        );
                        if (firstControlData.length === 0 || secondControlData.length === 0 || firstControlData.length !== secondControlData.length ||  !firstControlData.every((value) => typeof value === "number") || !secondControlData.every((value) => typeof value === "number")) {
                          return "NA";
                        }
                    
                       // Create new arrays without null values
                      const filteredFirstControlData = [];
                      const filteredSecondControlData = [];

                      for (let i = 0; i < firstControlData.length; i++) {
                        if (firstControlData[i] !== null && firstControlData[i] !== -Infinity && secondControlData[i] !== null && secondControlData[i] !== -Infinity) {
                          filteredFirstControlData.push(firstControlData[i]);
                          filteredSecondControlData.push(secondControlData[i]);
                        }
                      }

                        const result = calculateCorrelation(
                          filteredFirstControlData,
                          filteredSecondControlData,
                          { decimals: 4 }
                        );
                        return isNaN(result) ? "NA" : result.toFixed(4);
                      })()
                  : "NA"}               
              </div>

              <div className="col-xl-4 my-2 d-flex justify-content-center">
                Total Correlation:{" "}                
                  {unfilteredSiteData.length
                  ? (() => {
                      const firstControlData = unfilteredSiteData
                      .filter(
                        (f) =>
                          f.firstControl !== "NA" &&
                          f.firstControlNum !== "NA" &&
                          f.secondControl !== "NA" &&
                          f.secondControlNum !== "NA"
                      )
                        .map((e) =>
                          numType === "log2" ? e.firstControl : e.firstControlNum
                        );
                      const firstTumorData = unfilteredSiteData
                        .filter(
                          (f) =>
                          f.firstTumor !== "NA" &&
                          f.firstTumorNum !== "NA" &&
                          f.secondTumor !== "NA" &&
                          f.secondTumorNum !== "NA" 
                        )
                        .map((e) => (numType === "log2" ? e.firstTumor : e.firstTumorNum));
                      const secondControlData = unfilteredSiteData
                        .filter(
                          (f) =>
                          f.firstControl !== "NA" &&
                          f.firstControlNum !== "NA" &&
                          f.secondControl !== "NA" &&
                          f.secondControlNum !== "NA"
                        )
                        .map((e) =>
                          numType === "log2" ? e.secondControl : e.secondControlNum
                        );
                      const secondTumorData = unfilteredSiteData
                        .filter(
                          (f) =>
                          f.firstTumor !== "NA" &&
                          f.firstTumorNum !== "NA" &&
                          f.secondTumor !== "NA" &&
                          f.secondTumorNum !== "NA" 
                        )
                        .map((e) => (numType === "log2" ? e.secondTumor : e.secondTumorNum));
                
                    if (
                        !firstControlData.every((value) => typeof value === "number") ||
                        !firstTumorData.every((value) => typeof value === "number") ||
                        !secondControlData.every((value) => typeof value === "number") ||
                        !secondTumorData.every((value) => typeof value === "number") ||
                        firstControlData.length !== secondControlData.length ||
                        firstTumorData.length !== secondTumorData.length
                      ) {
                        return "NA";
                    }
                    
                     // Create new arrays without null values
                    const filteredFirstData = [];
                    const filteredSecondData = [];

                    for (let i = 0; i < firstControlData.concat(firstTumorData).length; i++) {
                      if (firstControlData.concat(firstTumorData)[i] !== null && firstControlData.concat(firstTumorData)[i] !== -Infinity && secondControlData.concat(secondTumorData)[i] !== null && secondControlData.concat(secondTumorData)[i] !== -Infinity) {
                        filteredFirstData.push(firstControlData.concat(firstTumorData)[i]);
                        filteredSecondData.push(secondControlData.concat(secondTumorData)[i]);
                      }
                    }



                    const result = calculateCorrelation(
                      filteredFirstData,
                      filteredSecondData,
                      { decimals: 4 }
                    );
                    return isNaN(result) ? "NA" : result.toFixed(4);
                  
                  })()
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
                  //filename={currentLabel ?  `${currentLabel}_${datasetName}_Correlation-${firstSite.label}-${form.gene.label}-${form.correlatedGene.label}_${secondSite.label}`: `${datasetName}_Correlation-${form.gene.label}_${firstSite.label}-${form.correlatedGene.label}_${secondSite.label}`}
                  filename={filenamePhos}
                  element={<a href="javascript:void(0)">Export Data</a>}>
                  <ExcelSheet dataSet={exportSummarySettings()} name="Input Configuration" />
                  <ExcelSheet dataSet={exportSiteData()} name="Site Data" />
                </ExcelFile>
              </div>
            </div>

            <Table
              columns={[
                ...correlationColumns.slice(0, 2),
                {
                  accessor: "firstPhospho",
                  // label: form.gene.label + "Phosphorylation Site",
                  label: form.gene.label +  " " + dataSetCorrelation,
                  Header: (
                    <OverlayTrigger
                      overlay={
                        <Tooltip id="site_correlation_phospho1">{form.gene.label} Phosphorylation Site</Tooltip>
                      }>
                      {/* <b>{form.gene.label} Phospho. Site</b> */}
                      <b>{form.gene.label} {dataSetCorrelation}</b>
                    </OverlayTrigger>
                  ),
                },
                {
                  accessor: "secondPhospho",
                  // label: form.correlatedGene.label + "Phosphorylation Site",
                  label: form.correlatedGene.label + " " + dataSetCorrelation,
                  Header: (
                    <OverlayTrigger
                      // overlay={
                      //   <Tooltip id="site_correlation_phospho2">
                      //     {form.correlatedGene.label} Phosphorylation Site
                      //   </Tooltip>
                      overlay={
                        <Tooltip id="site_correlation_phospho2">
                          {form.correlatedGene.label} {dataSetCorrelation},
                        </Tooltip>
                      }>
                      {/* <b>{form.correlatedGene.label} Phospho. Site</b> */}
                      <b>{form.correlatedGene.label} {dataSetCorrelation}</b>
                    </OverlayTrigger>
                  ),
                },
                ...correlationColumns.slice(2),
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
