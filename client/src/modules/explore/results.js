import { useRecoilValue } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button"
import Table, { RangeFilter, TextFilter } from "../components/table";
import Plot from "react-plotly.js";
import { casesState, formState } from "./explore.state";
import { useState } from "react";

export default function Results() {
  const cases = useRecoilValue(casesState);
  const form = useRecoilValue(formState)
  const tumors = form.cancer.map((c) => c.value)
  const [view, setView] = useState(tumors[0])
  const [tab, setTab] = useState('summary')



  const proteinAbundanceColumns = [
    {
      accessor: "name",
      Header: "Patient ID",
      Filter: TextFilter,
    },
    {
      accessor: "proteinLogRatioControl",
      Header: "Control Value",
      Filter: RangeFilter,
    },
    {
      accessor: "proteinLogRatioCase",
      Header: "Case Value",
      Filter: RangeFilter,
    },
    // {
    //   accessor: "proteinLogRatioChange",
    //   Header: "Fold Change Value",
    //   Filter: RangeFilter,
    // },
  ];

  const summaryColumns = [
    {
      accessor: 'link',
      Header: "Tumor Type",
      Filter: TextFilter,
    },
    {
      accessor: 'controlAverage',
      Header: 'Average Control',
      Filter: RangeFilter,
    },
    {
      accessor: 'caseAverage',
      Header: 'Average Case',
      Filter: RangeFilter,
    },
    {
      accessor: 'controlNum',
      Header: 'Control Count',
      Filter: RangeFilter,
    },
    {
      accessor: 'caseNum',
      Header: 'Case Count',
      Filter: RangeFilter,
    }
  ]



  const boxPlotData = [
    {
      y: cases.filter((c) => c.cancerId === view).map((c) => c.proteinLogRatioControl),
      type: "box",
      boxpoints: "all",
      name: "Control",
    },
    {
      y: cases.filter((c) => c.cancerId === view).map((c) => c.proteinLogRatioCase),
      type: "box",
      boxpoints: "all",
      name: "Case",
    },
  ];

  const average = (values) =>
    values.filter((v) => v !== null).reduce((a, b) => a + b) / values.length;

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
  }


  const averages = form.cancer.map((c) => {

    const caseFilter = cases.filter((d) => c.value === d.cancerId && d.proteinLogRatioCase !== null).map((e) => Math.pow(2,e.proteinLogRatioCase))
    const controlFilter = cases.filter((d) => c.value === d.cancerId && d.proteinLogRatioControl !== null).map((e) => Math.pow(2,e.proteinLogRatioControl))

    return (
      {
        'id': c.value,
        'name': c.label,
        'link': <a onClick={() => {setView(c.value); setTab('caseView')}} href='javascript:void(0)'>{c.label}</a>,
        'controlAverage': !isNaN(controlFilter[0]) ? average(controlFilter).toFixed(4) : 'NA',
        'caseAverage': !isNaN(caseFilter[0]) ? average(caseFilter).toFixed(4) : 'NA',
        'controlNum': !isNaN(controlFilter[0]) ? controlFilter.length : 0,
        'caseNum': !isNaN(caseFilter[0]) ? caseFilter.length : 0,
      }
    )

  })

  function multiBarPlotData() {
    return ([
      {
        x: averages.map((c) => c.name),
        y: averages.map((c) => c.controlAverage),
        type: 'bar',
        name: 'Control'
      },
      {
        x: averages.map((c) => c.name),
        y: averages.map((c) => c.caseAverage),
        type: 'bar',
        name: 'Case'
      }
    ])
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
        <Row>
          <Col xl={12}>
            <Plot
              data={multiBarPlotData()}
              layout={{ ...defaultLayout, barmode:'group' }}
              config={defaultConfig}
              useResizeHandler
              className="flex-fill w-100"
              style={{ height: "500px" }}
            />
          </Col>

        </Row>

        <Table
          columns={summaryColumns}
          data={averages}
        />

      </Tab>

      <Tab eventKey="caseView" title="Case View">
        <Form.Group className="m-3 col-xl-3" controlId="tumorView">
          <Form.Label>Tumor Type</Form.Label>
          <Form.Select name="tumorView" onChange={(e) => setView(parseInt(e.target.value))} value={view} required>
            {form.cancer.map((o) => (
              <option value={o.value} key={`dataset-${o.value}`}>
                {o.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Row>
          <Col xl={6}>
            <Plot
              data={boxPlotData}
              layout={defaultLayout}
              config={defaultConfig}
              useResizeHandler
              className="w-100"
              style={{ height: "800px" }}
            />
          </Col>
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
        </Row>
        <Table
          columns={proteinAbundanceColumns}
          data={cases.filter((c) => view === c.cancerId).map((c) => {
            return ({
              ...c,
              proteinLogRatioCase: c.proteinLogRatioCase ? c.proteinLogRatioCase.toFixed(4) : 'NA',
              proteinLogRatioControl: c.proteinLogRatioControl  ? c.proteinLogRatioControl.toFixed(4) : 'NA'
            })
          })}
        />
      </Tab>
    </Tabs>
  );
}
