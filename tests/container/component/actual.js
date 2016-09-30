'use strict';

import React, { Component, StyleSheet, Text, View } from 'react-native';
const {connect} = require('react-redux');

class Inline extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.instructions}>
          Instructions
        </Text>
        <View />
        <View></View>
        {this.viewMore()}
      </View>
    );
  }

  viewMore() {
    return (
      <Text style={styles.more}>
        View More...
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  container: {},
  instructions: {},
  more: {}
});

function select(store) {
  return {
    random: store.random,
  };
}

module.exports = connect(select, {})(Inline);
