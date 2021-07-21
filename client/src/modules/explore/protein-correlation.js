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
    hoverlabel: { bgcolor: "#FFF" },
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
    },
    {
      x: proteinRNA.map((e) => e.proteinControl),
      y: proteinRNA.map((e) => e.rnaControl),
      mode: "markers",
      type: "scatter",
      name: "Control",
    },
  ];

  console.log(
    calculateCorrelation(
      proteinRNA.map((e) => e.proteinTumor),
      proteinRNA.map((e) => e.rnaTumor),
      { decimals: 4 },
    ),
  );

  return (
    <Tabs activeKey={tab} onSelect={(e) => setTab(e)} className="mb-3">
      <Tab eventKey="summary" title="Summary">
        <Row className="m-3">
          <Col xl={12}>
            <Plot
              data={proteinRNAScatter}
              layout={{
                ...defaultLayout,
                title: "<b>Protein and mRNA</b>",
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
      </Tab>
    </Tabs>
  );
}
