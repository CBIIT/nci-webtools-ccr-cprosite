import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { NavLink } from "react-router-dom";

export default function Home() {
  return (
    <>
      <div className="bg-primary text-light py-7 mb-4">
        <Container>
          <h1 className="mb-3">Welcome to CPTAC Search</h1>
          <NavLink className="btn btn-lg btn-outline-light" to="/explore">
            Explore Cancer Types
          </NavLink>
        </Container>
      </div>

      <Container>
        <Row>
          <Col md={4} className="mb-4">
            <h2>About CPTAC Search</h2>
          </Col>
          <Col md={8} className="mb-4">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
              imperdiet ligula lacinia, blandit dui sed, porta nulla. Mauris
              efficitur at eros sed pretium. Pellentesque mattis tellus massa,
              sed elementum sem suscipit quis. Quisque vehicula viverra
              suscipit. Donec luctus mollis congue. Nunc eget porttitor lorem.
              Suspendisse lobortis urna sapien, eget ornare purus hendrerit
              eget. Vestibulum ante ipsum primis in faucibus orci luctus et
              ultrices posuere cubilia curae; Vivamus venenatis viverra
              pellentesque. Nullam a ipsum semper augue dictum placerat.
              Vestibulum elementum turpis enim, et auctor orci imperdiet et.
              Praesent purus lacus, maximus feugiat lacinia blandit,
              pellentesque ac justo. Aliquam aliquam pharetra neque, vel aliquam
              urna aliquam ut. Aenean molestie est eros, ac dapibus est aliquam
              et.
            </p>

            <p>
              Suspendisse pulvinar consequat felis eget rutrum. Vivamus
              ullamcorper tortor quis eros lobortis dignissim. Donec tincidunt
              quam sit amet diam malesuada egestas. Aliquam sit amet imperdiet
              nunc. Integer dictum ante quis risus euismod tempor. Donec
              interdum lorem eget leo maximus, posuere commodo mauris rhoncus.
              Nulla volutpat libero mi, vel consequat magna dictum ut. Aliquam
              massa ante, imperdiet et cursus in, tincidunt iaculis mi. Donec
              sodales nisl vel vestibulum maximus. Nulla sed egestas nunc. Nunc
              sit amet cursus eros, sed ornare enim. Sed in mauris iaculis,
              vulputate augue eu, porta enim. Pellentesque suscipit odio ligula,
              sed cursus nisi convallis nec. Aenean accumsan mattis sapien, id
              rhoncus turpis porttitor vitae. Ut ornare eros aliquet orci
              ornare, sit amet suscipit tellus viverra. Vivamus ut sollicitudin
              turpis, ut tincidunt mauris.
            </p>
          </Col>
        </Row>
      </Container>
    </>
  );
}
