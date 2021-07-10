import BootstrapNavbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import { NavLink } from "react-router-dom";

export default function Navbar({ links = [], className, children }) {
  return (
    <BootstrapNavbar bg="white" variant="light" className={className}>
      <Container>
        {children}
        <Nav className="me-auto">
          {links?.map((link) => (
            <NavLink
              to={link.path}
              key={link.path}
              activeClassName="active"
              className="nav-link"
              exact={link.exact}>
              {link.title}
            </NavLink>
          ))}
        </Nav>
      </Container>
    </BootstrapNavbar>
  );
}
