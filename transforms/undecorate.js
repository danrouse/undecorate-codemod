const defaultOptions = {
  compose: false,
  composeName: 'compose',
  composePackage: 'react-apollo',
  transformUndecoratedName: (originalName) => `Undecorated${originalName}`,
};

const recastOptions = {
  quote: 'single',
  tabWidth: 2,
};

function getImportDeclarations(j, root) {
  const importDeclarations = {};
  root.find(j.ImportDeclaration).forEach(path => {
    path.node.specifiers.forEach(s => {
      importDeclarations[s.local.name] = path.node.source.value;
    });
  });
  // TODO: requires
  // find VariableDeclaration
  //   .declarations[].init.callee.name === 'require'
  //   .declarations[].init.callee.arguments[0].value === packageName
  return importDeclarations;
}

function addComposeImport(j, root, options) {
  const importDeclarations = getImportDeclarations(j, root);
  if (!importDeclarations.hasOwnProperty(options.composeName)) {
    const importSpecifier = j.importSpecifier(j.identifier(options.composeName), j.identifier(options.composeName));
    if (Object.values(importDeclarations).includes(options.composePackage)) {
      root.find(j.ImportDeclaration, { source: { value: options.composePackage } })
          .forEach(p => { p.node.specifiers.push(importSpecifier); });
    } else {
      root.find(j.ImportDeclaration)
          .at(-1)
          .insertAfter(j.importDeclaration([importSpecifier], j.literal(options.composePackage)));
    }
  }
}

function getComposedExpression(j, options, decorators, wrappedName) {
  return `${options.composeName}(
  ${decorators.map(d => j(d.expression).toSource().replace(/\n/g, '\n  ')).join(',\n  ')}
)(${wrappedName});`;
  // would rather use a proper callExpression, but can't force add newlines between args?
  return j(
    j.callExpression(
      j.callExpression(
        j.identifier(options.composeName),
        decorators.map(d => d.expression)
      ),
      [j.identifier(wrappedName)]
    )
  ).toSource(recastOptions);
}

function getCurriedExpression(j, decorators, wrappedName) {
  return decorators.reduceRight(
    (acc, d) => j(
      j.callExpression(d.expression, [j.identifier(acc)])
    ).toSource(),
    wrappedName
  );
}

export default function transformer(file, api, userOptions) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const options = Object.assign({}, defaultOptions, userOptions);

  return root
    .find(j.ClassDeclaration)
    .map(path => {
      // Make sure we have decorators
      if (!path.node.decorators || path.node.decorators.length === 0) {
        return path;
      }

      // Clear the decorators
      const decorators = path.node.decorators;
      delete path.node.decorators;

      const isDefaultExport = path.parentPath.node.type === 'ExportDefaultDeclaration';
      const isNamedExport = path.parentPath.node.type === 'ExportNamedDeclaration';
      const isExport = isDefaultExport || isNamedExport;

      // Rename classes that are not immediately exported
      const publicName = path.node.id.name;
      let wrappedName = publicName;
      if (!isDefaultExport) {
        wrappedName = options.transformUndecoratedName(publicName);
        path.node.id.name = wrappedName;
      }

      // Start a buffer with the undecorated class
      let buffer = j(path).toSource() + '\n\n';
      if (isExport) buffer += 'export ';
      if (isDefaultExport) buffer += 'default ';
      if (!isDefaultExport) buffer += `const ${publicName} = `;

      // Call the decorators on the class
      let undecoratedExpression;
      if (options.compose && decorators.length > 1) {
        addComposeImport(j, root, options);
        undecoratedExpression = getComposedExpression(j, options, decorators, wrappedName);
      } else {
        undecoratedExpression = j(getCurriedExpression(j, decorators, wrappedName)).toSource(recastOptions);
      }
      buffer += undecoratedExpression;

      // Replace the export statement if being immediately exported
      const dstPath = isExport ? path.parent : path;
      return dstPath.replace(buffer);
    })
    .toSource();
}
