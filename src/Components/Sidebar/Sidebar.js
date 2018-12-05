import React, { Component } from 'react';
import MangaData from '../../Data/MangaData.json';
import SidebarManga from './SidebarManga.js';

class Sidebar extends Component {
    render() {
        return (
            <div className="side-bar-wrapper">
            <div className="side-bar">
              <div className="sidebar-title">
                <p>Recommended Manga</p>
              </div>
              <div className="sidebar-content">
                {
                  MangaData.map((x,key)=>{
                    return <SidebarManga key={key}
                    MangaName={x.MangaName}
                    ImageSource={x.MangaImage}
                    id={x.id}></SidebarManga>
                  })
                }
              </div>
            </div>
          </div>
        );
    }
}

export default Sidebar;