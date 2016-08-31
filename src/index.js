'use strict';

const _apLayoutKey = '_apLayoutKey';

module.exports = function ({types: t}) {
  var component;

  /**
   * transform JSX style layout to a Modifier function
   */
  function transformLayout(statement) {
    // Transform to layout function
    var actions = statement.expression.children;

    var blocks = [];
    var o = t.identifier('o');
    var type = t.memberExpression(o, t.identifier('type'));
    var config = t.memberExpression(o, t.identifier('config'));
    var children = t.memberExpression(
      t.memberExpression(o, t.identifier('children')),
      t.identifier('push')
    );
    var element = t.memberExpression(o, t.identifier('element'));
    var stopRender = t.memberExpression(o, t.identifier('stopRender'));

    for (var ii = 0, actionsLength = actions.length; ii < actionsLength; ii++) {
      var action = actions[ii];
      if (action.type !== 'JSXElement') {
        continue;
      }
      var statements = [];
      // Transform each action to block
      switch (action.openingElement.name.name) {
        // Transform content
        case 'addChildren':
        case 'update':
          for (var j = 0, childrenLen = action.children.length; j < childrenLen; j++) {
            var child = action.children[j];
            var param = undefined;
            if (child.type === 'JSXElement') {
              // @TODO process 'before' and 'after' element
              if (child.openingElement.name.name === 'props') {
                // Update props
                var attributes = child.openingElement.attributes;
                for (var jj = 0, attsLength = attributes.length; jj < attsLength; jj++) {
                  if (jj === 0) {
                    statements.push(t.assignmentExpression('=', config, t.logicalExpression(
                      '||', config, t.objectExpression([])
                    )));
                  }
                  var att = attributes[jj];
                  var left = t.memberExpression(config, t.stringLiteral(att.name.name), true);
                  var right;
                  if (att.value.type === 'JSXExpressionContainer') {
                    right = att.value.expression;
                  } else {
                    right = att.value;
                  }
                  statements.push(t.assignmentExpression('=', left, right));
                }
              } else {
                // JSX element
                param = child;
              }
            } else if (child.type === 'JSXExpressionContainer') {
              // JS expression
              param = child.expression;
            } else if (child.value.trim().length > 0) {
              // Text string
              param = t.stringLiteral(child.value);
            }
            if (param !== undefined) {
              statements.push(t.callExpression(children, [param]))
            }
          }
          break;
        case 'replace':
          for (var j = 0, childrenLen = action.children.length; j < childrenLen; j++) {
            var child = action.children[j];
            if (child.type === 'JSXExpressionContainer') {
              statements.push(t.assignmentExpression('=', element, child.expression));
              break;
            } else if (child.type === 'JSXElement') {
              statements.push(t.assignmentExpression('=', element, child));
              break;
            }
          }
          break;
        case 'remove':
          statements.push(t.assignmentExpression('=', stopRender, t.booleanLiteral(true)));
          break;
        default:
          // Do not transform
      }
      if (statements.length === 0) {
        continue;
      }
      statements = statements.map(function(exp) {
        return t.expressionStatement(exp);
      });
      // Check if conditions
      var tests = [], configCondition = true;
      var conditions = action.openingElement.attributes;
      for (var j = 0, conditionsLength = conditions.length; j < conditionsLength; j++) {
        var condition = conditions[j];
        if (condition.name.name === 'type') {
          // Type condition
          if (condition.value.type === 'JSXExpressionContainer') {
            tests.push(t.binaryExpression(
              '===',
              type,
              condition.value.expression
            ));
          } else {
            statements = [];
          }
        } else {
          if (configCondition) {
            tests.push(config);
            configCondition = false;
          }
          tests.push(t.binaryExpression(
            '===',
            t.memberExpression(config, t.stringLiteral(condition.name.name), true),
            condition.value.type === 'JSXExpressionContainer' ? condition.value.expression : condition.value
          ));
        }
      }

      // Append to blocks
      if (tests.length === 0) {
        blocks = blocks.concat(statements);
      } else {
        blocks.push(t.ifStatement(
          tests.reduce(function(l, r) {
            return t.logicalExpression('&&', l, r);
          }),
          t.blockStatement(statements)
        ));
      }
    }

    statement.expression = t.assignmentExpression(
      '=',
      t.memberExpression(t.identifier('module'), t.identifier('exports')),
      t.functionExpression(null, [o], t.blockStatement(blocks))
    );
  }

  return {
    inherits: require('babel-plugin-transform-react-jsx'),
    visitor: {
      JSXElement: function JSXElement(path, state) {
        if (component === false) {
          return;
        }
        if (component === undefined) {
          // Init transform component
          var rootDir = __dirname.substr(0,
            __dirname.indexOf('node_modules/babel-plugin-react-native-layout/lib')
          );
          var filename = state.file.opts.filename;
          /* istanbul ignore else  */
          if (filename.indexOf(rootDir) === 0) {
            filename = filename.substr(rootDir.length);
            if (filename.indexOf('app/') === 0) {
              filename = filename.substr(4);
            }
          }

          // Transform file from node_modules folder
          if (filename.indexOf('node_modules') !== -1) {
            if (filename.indexOf('node_modules/apentle-plugin-') !== -1) {
              // Process plugin key
              filename = filename.substr(
                filename.indexOf('node_modules/apentle-plugin-') + 21
              );
            } else if (filename.indexOf('node_modules/apentle-theme-') !== -1) {
              // Process theme key
              filename = filename.substr(
                filename.indexOf('/',
                  filename.indexOf('node_modules/apentle-theme-') + 21
                ) + 1
              );
            } else {
              // DO NOT transform any file out of apentle system
              component = false;
              return;
            }
          }

          filename = filename.substr(0, filename.lastIndexOf('.')); // remove .js
          filename = filename.replace(/[^a-zA-Z0-9]/g, '_'); // special char to _

          component = true;

          // Insert layoutKey declaration
          state.file.path.unshiftContainer('body', t.variableDeclaration(
            'var',
            [t.variableDeclarator(
              t.identifier(_apLayoutKey),
              t.stringLiteral(filename)
            )]
          ));

          // Overwrite React.createElement
          state.set('jsxIdentifier', function() {
            return t.identifier('_createRNElement');
          });
        }
        // Transform component
        var attributes = path.node.openingElement.attributes;
        attributes.push(t.JSXAttribute(
          t.JSXIdentifier('layoutKey'), t.JSXExpressionContainer(t.JSXIdentifier(_apLayoutKey))
        ));
        attributes.push(t.JSXAttribute(
          t.JSXIdentifier('layoutContext'), t.JSXExpressionContainer(t.thisExpression())
        ));
      },
      Program: function Program(path, state) {
        component = undefined;

        var body = path.node.body;
        for (var i = body.length; i--; ) {
          var statement = body[i];
          if (statement.type === 'ExpressionStatement' && statement.expression.type === 'JSXElement') {
            component = false;
            transformLayout(statement);
            return;
          }
        }
      },
    }
  };
}
