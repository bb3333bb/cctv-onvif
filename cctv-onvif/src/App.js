import React, { Component } from "react";
import "./App.css";
import { Header } from "./global/header";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

import Camera from "./main/Camera";
import ConnectCam from "./main/ConnectCam";
import ControlCam from "./main/ControlCam";


class App extends Component {
  render() {
    return (
      <Router>
      <div className="App">
          <Header />

              <Route exact path="/" component={Camera} />
              <Route path="/connectCam" component={ConnectCam} />  
              <Route path="/controlCam" component={ControlCam} />
            
        </div>
      </Router>
  );
  }
}

export default App;
