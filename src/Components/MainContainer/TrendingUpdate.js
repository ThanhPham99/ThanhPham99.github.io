import React, { Component } from 'react';

class TrendingUpdate extends Component {
    render() {
        return (
            <div className="trending-update">
        <div className="trending-title">
          <p>In the last few hours</p>
          <div className="temp">
            <h1>Trending Updates</h1>
            <a href={this.props.TrendingLink} style={{fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold', color: 'rgb(0, 183, 255)'}}>View all</a>
          </div>
        </div>
        <div className="trending-wrapper">
          <div className="col-3">
            <img src="https://f01.mrcdn.info/file/mrportal/i/a/k/m/DO.70FU2Z9S.jpg" alt=" " />
            <div className="trending-content">
              <a href={this.props.TrendingLink} className="trending-up">Manga 1</a>
              <a href={this.props.TrendingLink} className="trending-down">Chapter 1</a>
            </div>
          </div>
          <div className="col-3">
            <img src="https://f01.mrcdn.info/file/mrportal/i/a/u/m/t.9czJG3Gb.png" alt=" " />
            <div className="trending-content">
              <a href={this.props.TrendingLink} className="trending-up">Manga 1</a>
              <a href={this.props.TrendingLink} className="trending-down">Chapter 1</a>
            </div>
          </div>
          <div className="col-3">
            <img src="https://f01.mrcdn.info/file/mrportal/i/a/s/6/Ry.dAEe3Znt.jpg" alt=" " />
            <div className="trending-content">
              <a href={this.props.TrendingLink} className="trending-up">Manga 1</a>
              <a href={this.props.TrendingLink} className="trending-down">Chapter 1</a>
            </div>
          </div>
          <div className="col-3">
            <img src="https://f01.mrcdn.info/file/mrportal/h/c/t/c/Qe.4_6e2Z1C.jpg" alt=" " />
            <div className="trending-content">
              <a href={this.props.TrendingLink} className="trending-up">Manga 1</a>
              <a href={this.props.TrendingLink} className="trending-down">Chapter 1</a>
            </div>
          </div>
          <div className="col-3">
            <img src="https://f01.mrcdn.info/file/mrportal/h/9/l/9/Gi.iBYNh12m.jpg" alt=" " />
            <div className="trending-content">
              <a href={this.props.TrendingLink} className="trending-up">Manga 1</a>
              <a href={this.props.TrendingLink} className="trending-down">Chapter 1</a>
            </div>
          </div>
        </div>
      </div>
        );
    }
}

export default TrendingUpdate;