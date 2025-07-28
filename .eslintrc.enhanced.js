module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'public/sw.js'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Enhanced rules for TECHNO SUTRA project
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    
    // Allow unused variables that start with underscore
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      },
    ],
    
    // Allow unused expressions for service initialization
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      },
    ],
    
    // Allow require imports for dynamic loading
    '@typescript-eslint/no-require-imports': 'warn',
    
    // Allow debugger in development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // Allow console statements in development
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    
    // Prefer const for variables that are never reassigned
    'prefer-const': 'error',
    
    // Allow shadowing of restricted names with warning
    'no-shadow-restricted-names': 'error',
    
    // React hooks rules
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    
    // Allow empty catch blocks for optional functionality
    'no-empty': ['error', { allowEmptyCatch: true }],
    
    // Allow any type for dynamic imports and service workers
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Allow non-null assertions for DOM elements we know exist
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // Performance and accessibility rules
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/aria-role': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    
    // Allow empty functions for optional callbacks
    '@typescript-eslint/no-empty-function': [
      'warn',
      { allow: ['arrowFunctions', 'functions', 'methods'] },
    ],
    
    // Custom rules for TECHNO SUTRA project
    'max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true }],
    'complexity': ['warn', 15],
    'max-depth': ['warn', 4],
    'max-params': ['warn', 5],
    
    // Import rules
    'import/no-unresolved': 'off', // Handled by TypeScript
    'import/extensions': 'off', // Handled by bundler
    
    // React specific rules
    'react/prop-types': 'off', // Using TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    'react/jsx-uses-react': 'off', // Not needed with new JSX transform
    'react/display-name': 'warn',
    'react/no-unescaped-entities': 'warn',
    
    // TypeScript specific rules
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-inferrable-types': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Performance rules
    'no-loop-func': 'warn',
    'no-inner-declarations': 'warn',
    
    // Code quality rules
    'eqeqeq': ['error', 'always'],
    'no-var': 'error',
    'prefer-arrow-callback': 'warn',
    'prefer-template': 'warn',
    'object-shorthand': 'warn',
    
    // Formatting rules (handled by Prettier, but good to have)
    'indent': 'off', // Handled by Prettier
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'semi': ['warn', 'always'],
    'comma-dangle': ['warn', 'es5'],
    'trailing-comma': 'off',
    
    // Allow specific patterns for TECHNO SUTRA
    'camelcase': [
      'warn',
      {
        allow: [
          'CACHE_NAME',
          'STATIC_CACHE',
          'DYNAMIC_CACHE',
          'IMAGE_CACHE',
          'MODEL_CACHE',
          'MAP_CACHE',
          'AR_CACHE',
          'FONTS_CACHE',
        ],
      },
    ],
  },
  
  // Override rules for specific file patterns
  overrides: [
    {
      files: ['src/services/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        'no-console': 'off', // Allow console in services for logging
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
    {
      files: ['src/components/**/*.tsx'],
      rules: {
        'react-hooks/exhaustive-deps': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
    {
      files: ['src/pages/**/*.tsx'],
      rules: {
        'complexity': ['warn', 20], // Pages can be more complex
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
    {
      files: ['public/sw.js'],
      env: {
        serviceworker: true,
        browser: true,
      },
      rules: {
        'no-console': 'off',
        'no-undef': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
    {
      files: ['*.config.js', '*.config.ts', 'vite.config.*'],
      rules: {
        'import/no-default-export': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['src/hooks/**/*.ts', 'src/hooks/**/*.tsx'],
      rules: {
        'react-hooks/exhaustive-deps': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
  ],
  
  // Global variables for service worker and PWA
  globals: {
    self: 'readonly',
    caches: 'readonly',
    clients: 'readonly',
    registration: 'readonly',
    skipWaiting: 'readonly',
    importScripts: 'readonly',
    workbox: 'readonly',
    __APP_VERSION__: 'readonly',
    __BUILD_TIME__: 'readonly',
  },
};
