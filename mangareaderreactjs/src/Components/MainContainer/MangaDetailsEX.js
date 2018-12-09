import React, { Component } from 'react';

class MangaDetailsEX extends Component {
    render() {
        return (
            <div>
                <div className="mangaReadContainer">
                <img src={this.props.mangaReadImg} className="mangaReadImg" alt=""/>
                <p className="mangaReadTitle">{this.props.mangaReadTitle}</p>
                </div>
                <p className="MGdescription">{this.props.MangaDescription}</p>
                <p style={{color: 'red',fontSize: '1.5rem', fontWeight:'bold'}}>Chapter List</p>
                <div className="mangaReadChapters">
                        <p href={this.props.nameLink+".html"}>{this.props.mangaReadChapterName}</p>
                </div>
            </div>
        );
    }
}

export default MangaDetailsEX;