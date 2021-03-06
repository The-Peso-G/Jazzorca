import React, { Component } from 'react'
import { connect } from 'react-redux'
import TrackList from './Elements/TrackList'
import Screen from './Screen'
import JOTitle from './Elements/JOTitle'
import { playNow } from '../store/actions'
import { JOThunkDispatch, JOTrack, HistoryJOTrack, ResultJOTrack } from '../helpers/types'
import { JOState } from '../store/configureStore'
import { filterResults } from '../helpers/utils'

interface HomeProps {
    dispatch: JOThunkDispatch,
    history: HistoryJOTrack[]
}

export class Home extends Component<HomeProps> {

    state: {
        lastListened: JOTrack[]
        recommendations: JOTrack[]
    }
    history: HistoryJOTrack[];

    constructor(props: HomeProps) {
        super(props);

        this.state = {
            lastListened: [],
            recommendations: []
        }

        this.history = props.history;
    }

    async _onPress(track: JOTrack) {
        return this.props.dispatch(playNow(track))
    }

    getLastListened() {
        let lastListened = [], i = 0;
        const { history } = this.props;
        while (lastListened.length < 20 && i < history.length) {
            const ht = history[i++];
            if (lastListened.findIndex(t => t.videoId === ht.videoId) === -1) {
                lastListened.push(ht);
            }
        }
        this.setState({ lastListened });
    }

    getRecommendations() {
        const { history } = this.props;
        const historyVideoIds = new Set<string>();

        const recommendationsMap = history.reduce(
            (
                previousRecommendations: { [videoId: string]: ResultJOTrack },
                track: JOTrack,
            ) => {
                let recommendations = {
                    ...previousRecommendations
                }

                for (const relatedTrack of track.related.results) {
                    if (!(relatedTrack.videoId in recommendations)) {
                        recommendations[relatedTrack.videoId] = {
                            ...relatedTrack,
                            relations: 1
                        };
                    } else {
                        recommendations[relatedTrack.videoId].relations!++;
                    }
                }

                historyVideoIds.add(track.videoId);

                return recommendations
            },
            {});
        
        for (const relatedVideoId of Object.keys(recommendationsMap)) {
            if (historyVideoIds.has(relatedVideoId)) {
                delete recommendationsMap[relatedVideoId]
            }
        }

        let recommendations = filterResults(Object.values(recommendationsMap));

        recommendations = recommendations.sort((a, b) => {
            return b.relations! - a.relations!
        }).slice(0, 100);

        this.setState({ recommendations });
    }

    componentDidMount() {
        this.getLastListened();
        this.getRecommendations();
    }

    componentDidUpdate() {
        if (this.history !== this.props.history) {
            this.getLastListened();
            this.getRecommendations();
            this.history = this.props.history;
        }
    }

    render() {
        return (
            <Screen>
                <JOTitle>Dernières écoutes</JOTitle>
                <TrackList
                    data={this.state.lastListened}
                    onPress={(track: JOTrack) => this._onPress(track)}
                    horizontal={true}
                />
                <JOTitle>Recommandations</JOTitle>
                <TrackList
                    data={this.state.recommendations}
                    onPress={(track: JOTrack) => this._onPress(track)}
                />
            </Screen>
        )
    }
}

const mapStateToProps = (state: JOState) => ({
    history: state.history.history
})


export default connect(mapStateToProps)(Home)
