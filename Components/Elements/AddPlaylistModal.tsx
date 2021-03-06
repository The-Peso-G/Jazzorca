import React, { Component } from 'react'
import { StyleSheet, TextInput, Alert, Text } from 'react-native'

import JOModal from './JOModal'
import JOButton from './JOButton';
import { connect } from 'react-redux';
import { addPlaylist } from '../../store/actions';
import { ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';


interface AddPlaylistModalProps {
    visible: boolean,
    forwardRef: ((instance: JOModal | null) => void),
    dispatch: ThunkDispatch<any, null, Action>,
}

class AddPlaylistModal extends Component<AddPlaylistModalProps> {
    textInput: TextInput | null
    _jomodal: JOModal | null
    state: {
        name: string
    }

    constructor(props: AddPlaylistModalProps) {
        super(props);

        this.state = {
            name: ""
        }

        this.textInput = null;
        this._jomodal = null;
    }

    _onShow() {
        this.textInput?.focus();
        this.setState({
            name: ""
        });
    }

    _createPlaylist() {
        const { dispatch } = this.props;
        if (this.state.name.length > 0) {
            dispatch(addPlaylist(this.state.name));
            this._jomodal?.hide();
        } else {
            Alert.alert('Le nom de la liste ne peut pas être vide.')
        }
    }

    render() {
        return (
            <JOModal
                ref={(ref) => {
                    this._jomodal = ref;
                    this.props.forwardRef(ref);
                }}
                onShow={() => this._onShow()}
            >
                <Text style={styles.modal_title}>Créer une nouvelle liste de lecture</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder={'Nom de la nouvelle liste'}
                    ref={ref => this.textInput = ref}
                    onSubmitEditing={() => this._createPlaylist()}
                    onChangeText={(name) => this.setState({ name })}
                />
                <JOButton
                    title={'Valider'}
                    onPress={() => this._createPlaylist()}
                />
            </JOModal>
        )
    }
}

const styles = StyleSheet.create({
    modal_title: {
        color: 'black',
        marginHorizontal: 10,
        marginTop: 10,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    textInput: {
        marginHorizontal: 10,
        fontSize: 20,
        backgroundColor: "rgba(255,255,255,.2)",
        color: 'black'
    }
})

export default connect()(AddPlaylistModal)