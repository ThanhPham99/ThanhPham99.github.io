import React, { Component } from 'react';
import {NavLink} from "react-router-dom";
class Navbar extends Component {
    render() {
        return (
            <nav>
                <img src="/logo.png" alt="Logo" className="logo"/>
                <div className="menu">
                    <NavLink to="/" activeClassName="meo">Home</NavLink>
                    <NavLink to="/AllManga">All manga</NavLink>
                    <NavLink to="/Recomnend">Recommend manga</NavLink>
                    <NavLink to="/Contact">Contact</NavLink>
                </div>
                <div className="search-bar">
                    <input type="text" placeholder="Search..."/>
                    <button><i className="fas fa-search"></i></button>
                </div>
            </nav>
        );
    }
}

export default Navbar;