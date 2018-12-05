import React, { Component } from 'react';
import MangaInfo from '../../Data/MangaData.json';
import Mangacontainer from './Mangacontainer.js';
class AllManga extends Component {
    render() {
        return (
          <div className="latest-update">
          <h1 style={{textAlign: 'center', padding: '1em', margin: 0, color: 'rgb(255, 115, 0)'}}>All manga</h1>
            {
              MangaInfo.map((x)=>{
                return <Mangacontainer
                MangaImageSrc={x.MangaImage}
                MangaName={x.MangaName}
                MangaChapter={x.MangaChapter}
                UpdateTime={x.UpdateTime}
                id={x.id}
                ></Mangacontainer>
              }
              )
            } 
          <div className="page-section">
            <a href>1</a>
            <a href>2</a>
            <a href>3</a>
            <a href>4</a>
            <a href>5</a>
            <p>...</p>
            <a href>Last</a>
          </div>
        </div>
        );
    }
}

export default AllManga;