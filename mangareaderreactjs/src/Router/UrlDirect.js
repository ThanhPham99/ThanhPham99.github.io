import React, { Component } from 'react';
import { Route} from "react-router-dom";
import MainContainer from '../Components/MainContainer/MainContainer';
import AllManga from '../Components/MainContainer/AllManga.js';
import mangaDetails from '../Components/MainContainer/mangaDetails';
import Form from '../Components/Contact/Form';
class UrlDirect extends Component {
    render() {
        return (    
                <div className="main-container">
                <Route exact path="/Home" component={MainContainer} />
                <Route exact path="/" component={MainContainer} />
                <Route path="/AllManga" component={AllManga} />
                <Route path="/Contact" component={Form} />
                <Route path="/manga/:slug.:id" component={mangaDetails} />
                </div>
        );
    }
}

export default UrlDirect;