import { Suspense } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import ExploreForm from "./explore-form";
import ErrorBoundary from "../components/error-boundary";

import Results from "./results";

export default function Explore() {
  function handleSubmit(event) {
    console.log("submit", event);
  }

  function handleReset(event) {
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
            <Card.Body>
              <Results />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
