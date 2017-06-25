module.exports = {
  parser: "babel-eslint",
  root: true,
  parserOptions: {
    sourceType: 'module'
  },
  // required to lint *.vue files
  plugins: [
    'html',
    'promise',
    'ava'
  ],
	extends: [
    'standard',
    'plugin:ava/recommended'
  ],
  // add your custom rules here
  rules: {
    // allow paren-less arrow functions
    'arrow-parens': 1,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  },
  env: {
    "node": true
  }
}
