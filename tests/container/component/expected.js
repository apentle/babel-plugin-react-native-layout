'use strict';

var _apLayoutKey = 'container_component_actual';
import React, { Component, StyleSheet, Text, View } from 'react-native';

class Inline extends Component {
  render() {
    return _createRNElement(
      View,
      { style: styles.container, layoutKey: _apLayoutKey,
        layoutContext: this
      },
      _createRNElement(
        Text,
        { style: styles.instructions, layoutKey: _apLayoutKey,
          layoutContext: this
        },
        'Instructions'
      ),
      _createRNElement(View, {
        layoutKey: _apLayoutKey,
        layoutContext: this
      }),
      _createRNElement(View, {
        layoutKey: _apLayoutKey,
        layoutContext: this
      }),
      this.viewMore()
    );
  }

  viewMore() {
    return _createRNElement(
      Text,
      { style: styles.more, layoutKey: _apLayoutKey,
        layoutContext: this
      },
      'View More...'
    );
  }
}

const styles = StyleSheet.create({
  container: {},
  instructions: {},
  more: {}
});

module.exports = Inline;
