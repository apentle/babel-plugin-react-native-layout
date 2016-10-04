'use strict';

const babylon = require('babylon');

const _apLayoutKey = '_apLayoutKey';
const _apConnect = '_apConnect';

module.exports = function ({types: t}) {
  var component, connecting, connect;

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
    var childrenPush = t.memberExpression(
      t.memberExpression(o, t.identifier('children')),
      t.identifier('push')
    );
    var childrenUnshift = t.memberExpression(
      t.memberExpression(o, t.identifier('children')),
      t.identifier('unshift')
    );
    var element = t.memberExpression(o, t.identifier('element'));
    var stopRender = t.memberExpression(o, t.identifier('stopRender'));

    for (var ii = 0, actionsLength = actions.length; ii < actionsLength; ii++) {
      var action = actions[ii];
      if (!t.isJSXElement(action)) {
        continue;
      }

      // Check if conditions
      var tests = [], configCondition = true, falseCondition = false;
      var conditions = action.openingElement.attributes;
      var children = childrenPush;
      for (var j = 0, conditionsLength = conditions.length; j < conditionsLength; j++) {
        var condition = conditions[j];
        if (condition.name.name === 'type') {
          // Type condition
          if (t.isJSXExpressionContainer(condition.value)) {
            tests.push(t.binaryExpression(
              '===',
              type,
              condition.value.expression
            ));
          } else {
            falseCondition = true;
            break;
          }
        } else if (condition.name.name === '_top') {
          children = childrenUnshift;
        } else {
          if (configCondition) {
            tests.push(config);
            configCondition = false;
          }
          tests.push(t.binaryExpression(
            '===',
            t.memberExpression(config, t.stringLiteral(condition.name.name), true),
            t.isJSXExpressionContainer(condition.value) ?
              condition.value.expression :
              (condition.value === null ? t.booleanLiteral(true) : condition.value)
          ));
        }
      }
      if (falseCondition) {
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
            if (t.isJSXElement(child)) {
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
                  if (t.isJSXExpressionContainer(att.value)) {
                    right = att.value.expression;
                  } else if (att.value === null) {
                    right = t.booleanLiteral(true);
                  } else {
                    right = att.value;
                  }
                  statements.push(t.assignmentExpression('=', left, right));
                }
              } else {
                // JSX element
                param = child;
              }
            } else if (t.isJSXExpressionContainer(child)) {
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
            if (t.isJSXExpressionContainer(child)) {
              statements.push(t.assignmentExpression('=', element, child.expression));
              break;
            } else if (t.isJSXElement(child)) {
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
            __dirname.indexOf('node_modules/babel-p')
          );
          var filename = state.file.opts.filename;
          /* istanbul ignore else  */
          if (filename.indexOf(rootDir) === 0) {
            filename = filename.substr(rootDir.length);
          }
          if (filename.indexOf('app/') === 0) {
            filename = filename.substr(4);
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
          filename = filename.toLowerCase();

          component = true;

          // react-redux transform connect
          var needDefineConnect = true;
          state.file.path.traverse({
            CallExpression: function CallExpression(path) {
              if (t.isIdentifier(path.node.callee) && path.node.callee.name === connect) {
                var args = path.node.arguments;
                args[0] = t.callExpression(
                  t.identifier(_apConnect),
                  args.length > 0 ? [args[0]] : []
                );
                if (needDefineConnect) {
                  state.file.path.unshiftContainer('body', babylon.parse(`
                    var ${_apConnect} = function(mapStateToProps) {
                        return function(store, ownProps) {
                          var state = typeof mapStateToProps === 'function' ? mapStateToProps(store, ownProps) : {};
                          events.emit(${_apLayoutKey}, state, store, ownProps);
                          return state;
                        }
                    };`));
                  needDefineConnect = false;
                }
              }
            }
          });

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
      VariableDeclaration: function VariableDeclaration(path, state) {
        if (connecting) {
          var declarations = path.node.declarations;
          for (var i = declarations.length; i--;) {
            var declaration = declarations[i];
            if (t.isObjectPattern(declaration.id)) {
              var properties = declaration.id.properties;
              for (var j = properties.length; j--; ) {
                var property = properties[j];
                if (t.isIdentifier(property.key) && property.key.name === connect) {
                  connecting = false;
                  return;
                }
              }
            }
          }
        }
      },
      ImportDeclaration: function ImportDeclaration(path, state) {
        if (connecting && t.isLiteral(path.node.source) && path.node.source.value === 'react-redux') {
          var specifiers = path.node.specifiers;
          for (var i = specifiers.length; i--; ) {
             var specifier = specifiers[i];
             if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported) && specifier.imported.name === connect) {
               connecting = false;
               if (t.isIdentifier(specifier.local)) {
                 connect = specifier.local.name;
               }
             }
          }
        }
      },
      Program: function Program(path, state) {
        // Ignore outside apentle system
        var filename = state.file.opts.filename;
        if (filename.indexOf('node_modules') !== -1
          && filename.indexOf('node_modules/apentle-') === -1) {
          component = false;
          connecting = false;
          return;
        }
        component = undefined;
        connecting = true;
        connect = 'connect';

        var body = path.node.body;
        for (var i = body.length; i--; ) {
          var statement = body[i];
          if (t.isExpressionStatement(statement) && t.isJSXElement(statement.expression)) {
            component = false;
            // Fix for apentle layouts with css-class
            // istanbul ignore next
            if (path.opts.JSXOpeningElement !== undefined && path.opts.JSXAttribute !== undefined) {
              path.traverse({
                JSXOpeningElement: path.opts.JSXOpeningElement,
                JSXAttribute: path.opts.JSXAttribute,
              });
            }
            transformLayout(statement);
            return;
          }
        }
      },
    }
  };
}
