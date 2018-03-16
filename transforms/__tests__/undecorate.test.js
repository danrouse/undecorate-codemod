const defineTest = require('jscodeshift/dist/testUtils').defineTest;

const tests = [
  'default-exported-class',
  'exported-later',
  'multiple-decorators',
  ['multiple-decorators-compose', { compose: true, composePackage: 'test-compose-package' }],
  'named-export',
  'not-exported',
  'with-param'
];

tests.forEach(test => {
  defineTest(
    __dirname,
    'undecorate',
    Array.isArray(test) ? test[1] : {flow: false},
    `undecorate/${Array.isArray(test) ? test[0] : test}`
  );
});
