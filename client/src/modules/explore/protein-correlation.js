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
import { proteinState, rnaState, formState } from "./explore.state";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import calculateCorrelation from "calculate-correlation";

import { useState } from "react";
import _ from "lodash";

export default function ProteinCorrelation() {
  const form = useRecoilValue(formState);
  const proteinData = useRecoilValue(proteinState);
  const rnaData = useRecoilValue(rnaState);
  const compareGene = form.correlatedGene;
  const type = form.correlation;

  const [tab, setTab] = useState("summary");

  const correlationColumns = [
    {
      accessor: "name",
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
      accessor: "proteinTumor",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_correlation_tumor">
              Protein Tumor Value
            </Tooltip>
          }>
          <b>Protein Tumor Value</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "rnaTumor",
      Header: (
        <OverlayTrigger
          overlay={<Tooltip id="protein_rna_tumor">RNA Tumor Value</Tooltip>}>
          <b>RNA Tumor Value</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "proteinControl",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_correlation_control">
              Protein Control Value
            </Tooltip>
          }>
          <b>Protein Control Value</b>
        </OverlayTrigger>
      ),
    },
    {
      accessor: "rnaControl",
      Header: (
        <OverlayTrigger
          overlay={
            <Tooltip id="protein_rna_control">RNA Control Value</Tooltip>
          }>
          <b>RNA Control Value</b>
        </OverlayTrigger>
      ),
    },
  ];

  const proteinRNA = proteinData.map((e) => {
    const rna = rnaData.find((d) => {
      return e.name === d.name;
    });

    return {
      name: e.name,
      proteinTumor: e.tumorValue,
      proteinControl: e.normalValue,
      rnaTumor: rna.tumorValue,
      rnaControl: rna.normalValue,
    };
  });

  const defaultLayout = {
    xaxis: {
      title: "Protein",
      zeroline: false,
    },
    yaxis: {
      title: "mRNA",
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

  const proteinRNAScatter = [
    {
      x: proteinRNA.map((e) => e.proteinTumor),
      y: proteinRNA.map((e) => e.rnaTumor),
      mode: "markers",
      type: "scatter",
      name: "Tumor",
      hovertemplate: "(%{x},%{y})<extra></extra>",
    },
    {
      x: proteinRNA.map((e) => e.proteinControl),
      y: proteinRNA.map((e) => e.rnaControl),
      mode: "markers",
      type: "scatter",
      name: "Control",
      hovertemplate: "(%{x},%{y})<extra></extra>",
    },
  ];

  return (
    <Tabs activeKey={tab} onSelect={(e) => setTab(e)} className="mb-3">
      <Tab eventKey="summary" title="Summary">
        <Row className="m-3">
          <Col xl={12}>
            <Plot
              data={proteinRNAScatter}
              layout={{
                ...defaultLayout,
                title: "<b>Protein and mRNA Correlation</b>",
                autosize: true,
              }}
              config={defaultConfig}
              useResizeHandler
              className="flex-fill w-100"
              style={{ height: "500px" }}
            />
          </Col>
        </Row>
        <Row className="m-3">
          Tumor Correlation:{" "}
          {calculateCorrelation(
            proteinRNA.map((e) => e.proteinTumor),
            proteinRNA.map((e) => e.rnaTumor),
            { decimals: 4 },
          )}
        </Row>
        <Row className="m-3">
          Control Correlation:{" "}
          {calculateCorrelation(
            proteinRNA.map((e) => e.proteinControl),
            proteinRNA.map((e) => e.rnaControl),
            { decimals: 4 },
          )}
        </Row>

        <div className="m-3">
          <Table
            columns={correlationColumns}
            data={proteinRNA.map((c) => {
              return {
                name: c.name,
                proteinTumor: c.proteinTumor,
                proteinControl: c.proteinControl,
                rnaTumor: c.rnaTumor,
                rnaControl: c.rnaControl,
              };
            })}
          />
        </div>
      </Tab>
    </Tabs>
  );
}
