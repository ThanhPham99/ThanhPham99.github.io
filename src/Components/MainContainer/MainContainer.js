import React, { Component } from 'react';
import TrendingUpdate from './TrendingUpdate';
import WeeklyTop from './WeeklyTop';
import RecentlyUpdate from './RecentlyUpdate';

class MainContainer extends Component {
    render() {
        return (
            <div>
              <TrendingUpdate></TrendingUpdate>
              <WeeklyTop></WeeklyTop>
              <RecentlyUpdate></RecentlyUpdate>
            </div>
        );
    }
}

export default MainContainer;