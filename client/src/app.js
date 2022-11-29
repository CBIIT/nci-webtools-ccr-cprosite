import { RecoilRoot } from "recoil";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./modules/components/navbar";
import About from "./modules/about/about";
import Explore from "./modules/explore/explore";

export default function App() {
  const navbarLinks = [
    { path: "/", title: "Explore", exact: "true" },
    { path: "/about", title: "About" },
  ];

  return (
    <RecoilRoot>
      <Router>
        <Navbar links={navbarLinks} className="shadow-sm" />
        <Routes>
          <Route path="/about" element={<About />} />
          <Route path="/" element={<Explore />} />
        </Routes>
      </Router>
    </RecoilRoot>
  );
}
