'use strict';

const _apLayoutKey = '_apLayoutKey';

module.exports = function ({types: t}) {
  var component;

  return {
    inherits: require('babel-plugin-transform-react-jsx'),
    visitor: {
      JSXElement: function JSXElement(path, state) {
        if (component === false) {
          return;
        }
        if (component === undefined) {
          // Init transform
          if (path.parentPath.parent.type === 'Program') {
            component = false;
            // @TODO Transform to layout function
            // @TODO Check layout key element

            return;
          } else {
            // Transform component
            var rootDir = __dirname.substr(0,
              __dirname.indexOf('node_modules/babel-plugin-react-native-layout/lib')
            );
            var filename = state.file.opts.filename;
            /* istanbul ignore else  */
            if (filename.indexOf(rootDir) === 0) {
              filename = filename.substr(rootDir.length);
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
      },
    }
  };
}
