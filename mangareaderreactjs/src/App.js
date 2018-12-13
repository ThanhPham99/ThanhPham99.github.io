import React, { Component } from 'react';
import './App.css';
import { BrowserRouter as Router} from "react-router-dom";
import Navbar from './Components/Navbar/Navbar.js';
import Sidebar from './Components/Sidebar/Sidebar.js';
import Footer from './Components/Footer/Footer.js'; 
import UrlDirect from './Router/UrlDirect';
class App extends Component {
  render() {
    return (
      <Router>
      <div className="App">
          <Navbar></Navbar>
          <header>
           <UrlDirect></UrlDirect>
           <Sidebar></Sidebar>
          </header>
          <Footer></Footer>
      </div>
      </Router>
    );
  }
}

export default App;
