import { Suspense } from "react";
import { useRecoilState } from "recoil";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import ExploreForm from "./explore-form";
import ErrorBoundary from "../components/error-boundary";
import { formState } from "./explore.state";
import Results from "./results";

export default function Explore() {
  const [form, setForm] = useRecoilState(formState);

  function handleSubmit(event) {
    setForm(event);
    console.log("submit", event);
  }

  function handleReset(event) {
    setForm(event);
    console.log("reset", event);
  }

  return (
    <Container className="my-4">
      <Row>
        <Col md={4}>
          <Card className="shadow">
            <Card.Body>
              <ErrorBoundary fallback="An unexpected error occured">
                <Suspense fallback="Loading...">
                  <ExploreForm onSubmit={handleSubmit} onReset={handleReset} />
                </Suspense>
              </ErrorBoundary>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow">
            <Card.Body className="p-0">
              <ErrorBoundary fallback="An unexpected error occured">
                <Suspense fallback="Loading...">
                  {![null, undefined, ""].includes(form.gene) ? (
                    <Results />
                  ) : (
                    <h2 className="p-5 h5 d-flex align-items-center justify-content-center">
                      Please Provide Search Parameters
                    </h2>
                  )}
                </Suspense>
              </ErrorBoundary>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
