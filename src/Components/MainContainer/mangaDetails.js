import React, { Component } from 'react';
import MangaData from '../../Data/MangaData.json';
import MangaDetailsEX from './MangaDetailsEX.js';
class mangaDetails extends Component {
    render() {
        return (
            <div>
                {
                    MangaData.map((value,key) =>{
                        if(value.id===parseInt(this.props.match.params.id)){
                        return <MangaDetailsEX key={key}
                        mangaReadImg={value.MangaImage}
                        mangaReadTitle={value.MangaName}
                        mangaReadChapterName={value.MangaChapter}
                        MangaDescription={value.Decription}
                        ></MangaDetailsEX>
                    }
                    return true;
                    })
                }
            </div>
        );
    }
}

export default mangaDetails;