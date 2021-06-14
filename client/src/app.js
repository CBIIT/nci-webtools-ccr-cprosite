import { RecoilRoot } from "recoil";
import { HashRouter as Router, Switch, Route } from "react-router-dom";
import Navbar from "./modules/components/navbar";
import Home from "./modules/home/home";
import About from "./modules/about/about";
import Explore from "./modules/explore/explore";

export default function App() {
  const navbarLinks = [
    { path: "/", title: "Home", exact: true },
    { path: "/explore", title: "Explore" },
    { path: "/about", title: "About" },
  ];

  return (
    <RecoilRoot>
      <Router>
        <Navbar links={navbarLinks} className="shadow-sm" />
        <Switch>
          <Route path="/about" component={About} />
          <Route path="/explore" component={Explore} />
          <Route path="/" component={Home} />
        </Switch>
      </Router>
    </RecoilRoot>
  );
}
