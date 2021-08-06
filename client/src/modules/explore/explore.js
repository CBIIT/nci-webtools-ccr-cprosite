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
    setForm({ ...event, openSidebar: false });
    console.log("submit", event);
  }

  function handleReset(event) {
    setForm(event);
    console.log("reset", event);
  }

  function results() {
    switch (form.dataset.value) {
      case "phosphoproteinData":
        return <PhosResults />;
      case "proteinData":
        return form.analysis.value === "tumor-control" ? (
          <Results />
        ) : form.correlation === "proteinMRNA" ? (
          <ProteinCorrelation />
        ) : (
          <ProteinGeneCorrelation />
        );
      default:
        return "";
    }
  }

  return (
    <Container className="my-4">
      <SidebarContainer
        collapsed={!_openSidebar}
        onCollapsed={(collapsed) => mergeForm({ ["openSidebar"]: !collapsed })}>
        <SidebarPanel classname="col-xl-4">
          <Card className="shadow">
            <Card.Body>
              <ErrorBoundary fallback="An unexpected error occured">
                <Suspense fallback="Loading...">
                  <ExploreForm onSubmit={handleSubmit} onReset={handleReset} />
                </Suspense>
              </ErrorBoundary>
            </Card.Body>
          </Card>
        </SidebarPanel>
        <MainPanel className="col-xl-8">
          <Card className="shadow">
            <Card.Body className="p-0">
              <ErrorBoundary fallback="An unexpected error occured">
                <Suspense fallback="Loading...">
                  {![null, undefined, ""].includes(form.gene) ? (
                    results()
                  ) : (
                    <h2 className="p-5 h5 d-flex align-items-center justify-content-center">
                      Please Provide Search Parameters
                    </h2>
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
