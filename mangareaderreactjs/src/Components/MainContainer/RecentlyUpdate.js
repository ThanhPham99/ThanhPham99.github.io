import React, { Component } from 'react';
import MangaInfo from '../../Data/MangaData.json';
import Mangacontainer from './Mangacontainer.js';
class RecentlyUpdate extends Component {
    render() {
        return (
      <div className="latest-update">
        <h3>Recently Update</h3>
        {
              MangaInfo.map((x,key)=>{
                return <Mangacontainer
                key={key}
                MangaImageSrc={x.MangaImage}
                MangaName={x.MangaName}
                MangaChapter={x.MangaChapter}
                UpdateTime={x.UpdateTime}
                id={x.id}
                ></Mangacontainer>
              })
        } 
      </div>
        );
    }
}

export default RecentlyUpdate;