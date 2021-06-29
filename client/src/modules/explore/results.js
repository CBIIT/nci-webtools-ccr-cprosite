import { useRecoilValue } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Table, { RangeFilter, TextFilter } from "../components/table";
import Plot from "react-plotly.js";
import { casesState, formState } from "./explore.state";


export default function Results() {
  const cases = useRecoilValue(casesState);
  const form = useRecoilValue(formState)
  const tumors = form.cancer.map((c) => c.value)

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
      accessor: 'name',
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
    }
  ]



  const boxPlotData = [
    {
      y: cases.filter((c) => tumors.includes(c.cancerId)).map((c) => c.proteinLogRatioControl),
      type: "box",
      boxpoints: "all",
      name: "Case",
    },
    {
      y: cases.filter((c) => tumors.includes(c.cancerId)).map((c) => c.proteinLogRatioCase),
      type: "box",
      boxpoints: "all",
      name: "Control",
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

    if (cases.filter((g) => c.value === g.cancerId).length !== 0) {
      return (
        {
          'id': c.value,
          'name': c.label,
          'controlAverage': average(cases.filter((d) => c.value === d.cancerId).map((e) => e.proteinLogRatioControl)),
          'caseAverage': average(cases.filter((d) => c.value === d.cancerId).map((e) => e.proteinLogRatioCase))
        }
      )
    }
    else {
      return (
        {
          'id': c.value,
          'name': c.label,
          'controlAverage': 'NA',
          'caseAverage': 'NA',
        }
      )
    }
  })

  console.log(averages)

  const defaultLayout = {
    xaxis: {
      zeroline: false,
    },
    yaxis: {
      title: "Log Protein Abundance",
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
    <Tabs defaultActiveKey="proteinAbundance" className="mb-3">

      <Tab eventKey="proteinAbundance" title="Protein Abundance">
        {averages.length > 1 ? <Row>
          {
            averages.map((e, index) => {
                return (
                  <Col xl={3}>
                    <Plot
                      key={index}
                      data={barPlotData(e)}
                      layout={{ ...defaultLayout, title: e.name }}
                      config={defaultConfig}
                      useResizeHandler
                      className="flex-fill w-100"
                      style={{ height: "500px" }}
                    />
                  </Col>
                )
            })
          }
        </Row> :
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
                data={barPlotData(averages[0])}
                layout={defaultLayout}
                config={defaultConfig}
                useResizeHandler
                className="w-100"
                style={{ height: "800px" }}
              />
            </Col>
          </Row>}

        {averages.length > 1 ?
          <Table
            columns={summaryColumns}
            data={averages}
          />
          :
          <Table
            columns={proteinAbundanceColumns}
            data={cases.filter((c) => tumors.includes(c.cancerId)).filter((c) => c.proteinLogRatioControl !== null)}
          />}
      </Tab>
    </Tabs>
  );
}
