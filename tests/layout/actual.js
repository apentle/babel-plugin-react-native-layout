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
  <Text style={styles.error}>
  </Text>
  <addChildren>
    <View style={styles.title}>
    </View>
  </addChildren>
  <update>
    <props style={styles.container} name="new" />
  </update>
  <replace>
    <View/>
  </replace>
  <replace>
    {viewMore()}
  </replace>
  <remove />
  <addChildren type={Text}> New Text </addChildren>
  <addChildren type='Text'> New Text </addChildren>
  <addChildren type={View} ref="content" name="container">
    <props style={styles.container} name="new" />
    {moreView()}
    {
      this.props.results.map(function(result) {
        return <ListItem data={result} />
      })
    }
  </addChildren>
  <update id="next">
  </update>
  <replace type={Text} style={styles.next}>
  </replace>
  <update id="title">
    <props style={styles.container} />
  </update>
  <replace type={Text} style={styles.container}>
    <Text>
      New Text
    </Text>
  </replace>
  <remove type={Text}>
  </remove>
</layout>
