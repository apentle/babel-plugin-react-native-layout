'use strict';

import React, { Text, View } from 'react-native';
import { styles } from 'react-native-theme';
const ListItem = require('./listItem');

function moreView() {
  return React.createElement(
    Text,
    { style: styles.more },
    'More...'
  );
}

module.exports = function (o) {
  o.children.push(React.createElement(View, { style: styles.title }));
  o.config = o.config || {};
  o.config['style'] = styles.container;
  o.config['name'] = 'new';
  o.element = React.createElement(View, null);
  o.element = viewMore();
  o.stopRender = true;

  if (o.type === Text) {
    o.children.push(' New Text ');
  }

  if (o.type === View && o.config && o.config['ref'] === 'content' && o.config['name'] === 'container') {
    o.config = o.config || {};
    o.config['style'] = styles.container;
    o.config['name'] = 'new';
    o.children.push(moreView());
    o.children.push(this.props.results.map(function (result) {
      return React.createElement(ListItem, { data: result });
    }));
  }

  if (o.config && o.config['id'] === 'title') {
    o.config = o.config || {};
    o.config['style'] = styles.container;
  }

  if (o.type === Text && o.config && o.config['style'] === styles.container) {
    o.element = React.createElement(
      Text,
      null,
      'New Text'
    );
  }

  if (o.type === Text) {
    o.stopRender = true;
  }
};
