import { Suspense, useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import ExploreForm from "./explore-form";
import ErrorBoundary from "../components/error-boundary";
import { formState } from "./explore.state";
import Results from "./results";
import PhosResults from "./phosphorylation-results";
import ProteinCorrelation from "./protein-correlation";
import ProteinGeneCorrelation from "./protein-genevsgene";
import ProteinPhosResults from "./proteinPhos-results";
import RNAResults from "./rna-results";
import {
  SidebarContainer,
  SidebarPanel,
  MainPanel,
} from "../components/sidebar-container";

export default function Explore() {
  const [form, setForm] = useRecoilState(formState);
  const mergeForm = (obj) => setForm({ ...form, ...obj });
  const [_openSidebar, _setOpenSidebar] = useState(true);

  useEffect(() => {
    _setOpenSidebar(form.openSidebar);
  }, [form.openSidebar]);

  function handleSubmit(event) {
    setForm({ ...event, submitted: true });
    console.log("submit", event);
  }

  function handleReset(event) {
    setForm(event);
    console.log("reset", event);
  }

  function results() {
    switch (form.dataset.value) {
      case "phosphoproteinData":
        return form.analysis.value === "tumor-control" ? (
          <PhosResults />
        ) : form.correlation === "proteinMRNA" ? (
          <ProteinCorrelation />
        ) : (
          <ProteinGeneCorrelation />
        );
      case "proteinData":
        return form.analysis.value === "tumor-control" ? (
          <Results />
        ) : form.correlation === "proteinMRNA" ? (
          <ProteinCorrelation />
        ) : (
          <ProteinGeneCorrelation />
        );
      case "phosphoproteinRatioData":
        return form.analysis.value === "tumor-control" ? (
          <ProteinPhosResults />
        ) : form.correlation === "proteinMRNA" ? (
          <ProteinCorrelation />
        ) : (
          <ProteinGeneCorrelation />
        );
      case "rnaLevel":
        return form.analysis.value === "tumor-control" ? (
          <RNAResults />
        ) :
        <></>
      default:
        return "";
    }
  }

  return (
    <Container className="my-4">
      <SidebarContainer
        collapsed={!_openSidebar}
        onCollapsed={(collapsed) => mergeForm({ ["openSidebar"]: !collapsed })}>
        <SidebarPanel>
          <Card className="shadow">
            <Card.Body>
              <ErrorBoundary
                fallback={
                  <div style={{ color: "red" }}>
                    The server encountered an internal error or
                    misconfiguration. Please contact{" "}
                    <a href="mailto:NCIcProSiteWebAdmin@mail.nih.gov">
                      NCIcProSiteWebAdmin@mail.nih.gov
                    </a>{" "}
                    and inform them your configuration settings and the time
                    that the error occured.{" "}
                  </div>
                }>
                <Suspense fallback="Loading...">
                  <ExploreForm onSubmit={handleSubmit} onReset={handleReset} />
                </Suspense>
              </ErrorBoundary>
            </Card.Body>
          </Card>
        </SidebarPanel>
        <MainPanel>
          <Card className="shadow h-100">
            <Card.Body className="p-0">
              <ErrorBoundary
                fallback={
                  <div style={{ color: "red" }}>
                    The server encountered an internal error or
                    misconfiguration. Please contact{" "}
                    <a href="mailto:NCIcProSiteWebAdmin@mail.nih.gov">
                      NCIcProSiteWebAdmin@mail.nih.gov
                    </a>{" "}
                    and inform them your configuration settings and the time
                    that the error occured.{" "}
                  </div>
                }>
                <Suspense fallback="Loading...">
                  {form.submitted ? (
                    results()
                  ) : (
                    <div className="m-2">
                      Please provide configuration settings for your analysis on
                      the left panel and click Submit.
                    </div>
                  )}
                </Suspense>
              </ErrorBoundary>
            </Card.Body>
          </Card>
        </MainPanel>
      </SidebarContainer>
    </Container>
  );
}
