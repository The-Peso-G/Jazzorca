import React from 'react'
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Linking } from 'react-native'
import { connect } from 'react-redux'
import Icon from 'react-native-vector-icons/AntDesign'
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { manualAddToQueue, resetCurrentTrack, addToPlaylist } from '../../../store/actions'
import JOText from '../JOText'
import JOButton from '../JOButton'
import TrackModal from '../TrackModal'
import JOModal from '../JOModal'
import { Picker } from '@react-native-community/picker'
import { Playlist, JOTrack, JOThunkDispatch } from '../../../helpers/types'

interface JOTrackListItemProps {
    nowPlaying: JOTrack,
    track: JOTrack,
    onPress: (track: JOTrack) => Promise<any>,
    dispatch: JOThunkDispatch,
    loading: boolean,
    playlists: Playlist[],
    modalExtra?: (track: JOTrack) => React.ReactNode,
    modalRef: (trackModal: TrackModal | null) => void,
    currentTrackChecker?: (track1: JOTrack, track2: JOTrack) => boolean,
    horizontal: boolean
}

class JOTrackListItem extends React.Component<JOTrackListItemProps> {
    state: {
        loading: boolean,
        modalVisible: boolean,
        errorModalVisible: boolean,
        error: string
    }

    playerLoading: boolean;
    modal: JOModal | null;
    errorModal: JOModal | null;

    constructor(props: JOTrackListItemProps) {
        super(props);

        this.state = {
            loading: false,
            modalVisible: false,
            errorModalVisible: false,
            error: ""
        };

        this.playerLoading = false;
        this.modal = null;
        this.errorModal = null;
    }

    _isCurrentTrack() {
        const { nowPlaying, track } = this.props;
        const defaultCurrentTrackChecker = () => nowPlaying !== undefined && nowPlaying.videoId === track.videoId;
        const currentTrackChecker = this.props.currentTrackChecker || defaultCurrentTrackChecker;
        return currentTrackChecker(nowPlaying, track);
    }

    _displayNowPlaying() {
        if (this._isCurrentTrack()) {
            return <Icon name='caretright' size={30} style={styles.is_playing_icon} />
        }
    }

    _displayLoading() {
        if (this.state.loading) {
            return <ActivityIndicator style={styles.is_playing_icon} />
        }
    }

    _onPress() {
        this.setState({ loading: true });
        this.props.onPress(this.props.track)
            .catch((error) => {
                this.setState({ error });
                this.errorModal!.show();
                this.props.dispatch(resetCurrentTrack());
            })
            .finally(() => this.setState({ loading: false }));
    }

    _addToQueue() {
        const { track, dispatch } = this.props
        this.modal!.hide();
        dispatch(manualAddToQueue(track))
            .catch((error) => {
                this.setState({ error });
                this.errorModal!.show();
            });
    }

    _watchOnYouTube() {
        Linking.openURL('https://youtu.be/' + this.props.track.videoId);
        this.modal!.hide();
    }

    _displayPlaylists() {
        const { playlists } = this.props;
        const pickerItems: any = [];

        playlists.forEach(playlist => {
            pickerItems.push(
                <Picker.Item
                    label={playlist.name}
                    value={playlist.id}
                    key={playlist.id}
                />
            )
        });

        return pickerItems;
    }

    private _addToPlaylist(itemValue: React.ReactText): void {
        const { dispatch, track } = this.props;
        const playlistId = itemValue.toString()

        dispatch(addToPlaylist(
            playlistId,
            track
        ));

        this.modal!.hide();
    }

    render() {
        return (
            <>
                <TrackModal
                    modalStyle={{ backgroundColor: 'red', padding: 7 }}
                    autoHide={2000}
                    ref={ref => { this.errorModal = ref }}
                >
                    <JOText style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', marginBottom: 5 }}>
                        Une erreur est survenue
                    </JOText>
                    <JOText style={{ textAlign: 'left', fontSize: 15, fontFamily: 'monospace' }}>
                        {this.state.error}
                    </JOText>
                </TrackModal>
                <TrackModal
                    ref={ref => { this.modal = ref; if (this.props.modalRef) this.props.modalRef(ref); }}
                >
                    <JOButton
                        icon={<MaterialCommunityIcon name='playlist-plus' size={30} color='black' />}
                        title={"Ajouter à la file d'attente"}
                        onPress={() => this._addToQueue()}
                    />
                    <JOButton
                        icon={<MaterialCommunityIcon name='youtube' size={30} color='black' />}
                        title={"Voir sur YouTube"}
                        onPress={() => this._watchOnYouTube()}
                    />
                    <View style={styles.add_playlist_button}>
                        <MaterialCommunityIcon name='playlist-music-outline' size={30} color='black' />
                        <Picker
                            style={styles.playlist_picker}
                            itemStyle={styles.playlist_picker_item}
                            onValueChange={(itemValue) => this._addToPlaylist(itemValue)}
                        >
                            <Picker.Item label="Ajouter à une liste de lecture" value="" />
                            {this._displayPlaylists()}
                        </Picker>
                    </View>
                    {this.props.modalExtra ? this.props.modalExtra!(this.props.track) : undefined}
                </TrackModal>
                <TouchableOpacity
                    onLongPress={() => this.modal!.show()}
                    onPress={() => this._onPress()}
                    disabled={this.state.loading}
                >
                    <View style={[styles.main_component, {
                        flexDirection: this.props.horizontal ? 'column' : 'row',
                        width: this.props.horizontal ? 100 : undefined,
                        marginHorizontal: this.props.horizontal ? 10 : undefined,
                        height: this.props.horizontal ? 200 : 70
                    }]}>
                        <View style={styles.imageBox}>
                            <Image
                                source={this.props.track.artwork}
                                style={styles.thumbnail}
                            />
                            <JOText style={styles.lengthText}>
                                {this.props.track.lengthText}
                            </JOText>
                            {this._displayNowPlaying()}
                            {this._displayLoading()}
                        </View>
                        <View
                            style={styles.meta_block}
                        >
                            <JOText style={[styles.title, styles.meta, this._isCurrentTrack() ? styles.title_current : undefined]} numberOfLines={2} >{this.props.track.title}</JOText>
                            <JOText style={[styles.artist, styles.meta]} numberOfLines={1} >{this.props.track.artist}</JOText>
                        </View>
                    </View>
                </TouchableOpacity>
            </>
        )
    }

    static defaultProps = {
        horizontal: false
    }
}


const styles: any = StyleSheet.create({
    main_component: {
        paddingHorizontal: 10,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    meta_block: {
        flex: 1,
        alignItems: 'flex-start'
    },
    meta: {
        fontSize: 15,
    },
    title: {
        marginBottom: 0,
        fontWeight: 'bold'
    },
    title_current: {
        color: '#1c5dff'
    },
    artist: {
        color: 'grey'
    },
    thumbnail: {
        width: 94,
        height: 47,
    },
    is_playing_icon: {
        position: "absolute",
        top: 5,
        left: -5
    },
    imageBox: {
        width: 100,
        marginRight: 10
    },
    lengthText: {
        position: "absolute",
        backgroundColor: 'rgba(0,0,0,0.7)',
        textAlign: 'right',
        right: 6,
        bottom: 0
    },
    modal_screen: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center'
    },
    modal_content: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        margin: 20
    },
    add_playlist_button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
        backgroundColor: '#e6e6e6',
    },
    playlist_picker: {
        color: 'black',
        flex: 1,
    },
    playlist_picker_item: {
        fontSize: 30
    },
})

const mapStateToProps = (state: any) => ({
    cache: state.playerState.cache,
    queue: state.playerState.queue,
    playlists: state.playlists.playlists
})


export default connect(mapStateToProps)(JOTrackListItem)