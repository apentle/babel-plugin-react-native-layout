# babel-plugin-react-native-layout
[![Build Status](https://travis-ci.org/apentle/babel-plugin-react-native-layout.svg?branch=master)](https://travis-ci.org/apentle/babel-plugin-react-native-layout) [![Coverage Status](https://coveralls.io/repos/github/apentle/babel-plugin-react-native-layout/badge.svg?branch=master)](https://coveralls.io/github/apentle/babel-plugin-react-native-layout?branch=master) [![npm version](https://badge.fury.io/js/babel-plugin-react-native-layout.svg)](https://badge.fury.io/js/babel-plugin-react-native-layout)

Dynamic layout for react native components

## Installation
```bash
npm i --save babel-plugin-react-native-layout
```

## Usage
Create file `.babelrc` in an apentle project folder
```javascript
{
  "presets": [ "react-native" ],
  "plugins": [ "react-native-layout" ]
}
```

## Layout transform
FROM
```javascript
'use strict';

import React, { Text, View } from 'react-native';
import { styles } from 'react-native-theme';
const ListItem = require('./listItem');

function moreView() {
  return (
    <Text style={styles.more}>
      More...
    </Text>
  );
}

<layout>
  <addChildren type={View} ref="content" name="container">
    <props style={styles.container} name="new" />
    {moreView()}
    {
      this.props.results.map(function(result) {
        return <ListItem data={result} />
      })
    }
  </addChildren>
</layout>

```
TO
```javascript
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
  if (o.type === View && o.config && o.config['ref'] === 'content' && o.config['name'] === 'container') {
    o.config = o.config || {};
    o.config['style'] = styles.container;
    o.config['name'] = 'new';
    o.children.push(moreView());
    o.children.push(this.props.results.map(function (result) {
      return React.createElement(ListItem, { data: result });
    }));
  }
};

```
