import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {ListView, View, TouchableOpacity, Image, StyleSheet, Keyboard, Platform} from 'react-native';
import {actions} from './const';

const defaultActions = [
  actions.insertImage,
  actions.setBold,
  actions.setItalic,
  actions.insertBulletsList,
  actions.insertOrderedList,
  actions.insertLink
];

function getDefaultIcon() {
  const texts = {};
  texts[actions.insertImage] = require('../img/icon_format_media.png');
  texts[actions.setBold] = require('../img/icon_format_bold.png');
  texts[actions.setItalic] = require('../img/icon_format_italic.png');
  texts[actions.insertBulletsList] = require('../img/icon_format_ul.png');
  texts[actions.insertOrderedList] = require('../img/icon_format_ol.png');
  texts[actions.insertLink] = require('../img/icon_format_link.png');
  return texts;
}


export default class RichTextToolbar extends Component {

  static propTypes = {
    getEditor: PropTypes.func.isRequired,
    actions: PropTypes.array,
    onPressAddLink: PropTypes.func,
    onPressAddImage: PropTypes.func,
    selectedButtonStyle: PropTypes.object,
    iconTint: PropTypes.any,
    selectedIconTint: PropTypes.any,
    unselectedButtonStyle: PropTypes.object,
    renderAction: PropTypes.func,
    iconMap: PropTypes.object,
  };

  static defaultProps = {
    avoidKeyboard: true
  };

  constructor(props) {
    super(props);
    const actions = this.props.actions ? this.props.actions : defaultActions;
    this.state = {
      editor: undefined,
      selectedItems: [],
      actions,
      ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}).cloneWithRows(this.getRows(actions, [])),
      keyboardSpacing: 0
    };
  }

  
  _keyboardDidHide = () => {
    this.setState({keyboardSpacing: 0})
  }

  _keyboardDidShow = (e) => {
    this.setState({keyboardSpacing: e.endCoordinates.height})
  }

  componentWillReceiveProps(newProps) {
    const actions = newProps.actions ? newProps.actions : defaultActions;
    this.setState({
      actions,
      ds: this.state.ds.cloneWithRows(this.getRows(actions, this.state.selectedItems))
    });
  }

  getRows(actions, selectedItems) {
    return actions.map((action) => {return {action, selected: selectedItems.includes(action)};});
  }

  componentDidMount() {
    const editor = this.props.getEditor();
    if (!editor) {
      throw new Error('Toolbar has no editor!');
    } else {
      editor.registerToolbar((selectedItems) => this.setSelectedItems(selectedItems));
      this.setState({editor});
      if (this.props.avoidKeyboard && Platform.OS !== "ios"){
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
      }
    }
  }

  componentWillUnmount() {
    if (this.keyboardDidShowListener) {
      this.keyboardDidShowListener.remove();
    }
    if (this.keyboardDidHideListener) {
      this.keyboardDidHideListener.remove();
    }
  }

  setSelectedItems(selectedItems) {
    if (selectedItems !== this.state.selectedItems) {
      this.setState({
        selectedItems,
        ds: this.state.ds.cloneWithRows(this.getRows(this.state.actions, selectedItems))
      });
    }
  }

  _getButtonSelectedStyle() {
    return this.props.selectedButtonStyle ? this.props.selectedButtonStyle : styles.defaultSelectedButton;
  }

  _getButtonUnselectedStyle() {
    return this.props.unselectedButtonStyle ? this.props.unselectedButtonStyle : styles.defaultUnselectedButton;
  }

  _getButtonIcon(action) {
    if (this.props.iconMap && this.props.iconMap[action]) {
      return this.props.iconMap[action];
    } else if (getDefaultIcon()[action]){
      return getDefaultIcon()[action];
    } else {
      return undefined;
    }
  }

  _defaultRenderAction(action, selected) {
    const icon = this._getButtonIcon(action);
    return (
      <TouchableOpacity
          key={action}
          activeOpacity={0.6}
          style={[
            {height: 50, width: 50, justifyContent: 'center', alignItems: 'center'},
            selected ? this._getButtonSelectedStyle() : this._getButtonUnselectedStyle()
          ]}
          onPress={() => this._onPress(action)}
      >
        {icon ? <Image source={icon} style={{tintColor: selected ? this.props.selectedIconTint : this.props.iconTint}}/> : null}
      </TouchableOpacity>
    );
  }

  _renderAction(action, selected) {
    return this.props.renderAction ?
        this.props.renderAction(action, selected) :
        this._defaultRenderAction(action, selected);
  }

  render() {
    const { keyboardSpacing = 0 } = this.state
    const { avoidKeyboard } = this.props
    const rootStyles = [
      { height: 50, backgroundColor: '#D3D3D3', alignItems: 'center' },
      avoidKeyboard && Platform.OS !== "ios" ? { marginBottom: keyboardSpacing } : {},
      this.props.style
    ]
    return (
      <View
          style={rootStyles}
      >
        <ListView
            horizontal
            contentContainerStyle={{flexDirection: 'row'}}
            dataSource={this.state.ds}
            renderRow= {(row) => this._renderAction(row.action, row.selected)}
        />
      </View>
    );
  }

  _onPress(action) {
    switch(action) {
      case actions.setBold:
      case actions.setItalic:
      case actions.insertBulletsList:
      case actions.insertOrderedList:
      case actions.setUnderline:
      case actions.heading1:
      case actions.heading2:
      case actions.heading3:
      case actions.heading4:
      case actions.heading5:
      case actions.heading6:
      case actions.setParagraph:
      case actions.removeFormat:
      case actions.alignLeft:
      case actions.alignCenter:
      case actions.alignRight:
      case actions.alignFull:
      case actions.setSubscript:
      case actions.setSuperscript:
      case actions.setStrikethrough:
      case actions.setHR:
      case actions.setIndent:
      case actions.setOutdent:
        this.state.editor._sendAction(action);
        break;
      case actions.insertLink:
        this.state.editor.prepareInsert();
        if(this.props.onPressAddLink) {
          this.props.onPressAddLink();
        } else {
          this.state.editor.getSelectedText().then(selectedText => {
            this.state.editor.showLinkDialog(selectedText);
          });
        }
        break;
      case actions.insertImage:
        this.state.editor.prepareInsert();
        if(this.props.onPressAddImage) {
          this.props.onPressAddImage();
        }
        break;
        break;
    }
  }
}

const styles = StyleSheet.create({
  defaultSelectedButton: {
    backgroundColor: 'red'
  },
  defaultUnselectedButton: {}
});