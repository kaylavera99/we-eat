module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es6: true
  },
  'extends': [
    'plugin:react/recommended',
    'eslint:recommended',
    
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module', 
    ecmaFeatures: {
      jsx: true 
    }
  },
  plugins: [
    'react',
    '@typescript-eslint' 
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'warn', 
    '@typescript-eslint/no-unused-vars': 'warn', 
    'no-unused-expressions': 'warn',
    'react/jsx-uses-react': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off'
  },
  settings: {
    react: {
      version: 'detect' 
    }
  }
}
