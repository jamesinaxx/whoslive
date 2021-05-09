module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: ['plugin:react/recommended', 'eslint:recommended'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 12,
		sourceType: 'module',
	},
	plugins: ['react', '@typescript-eslint'],
	rules: {
		indent: ['error', 'tab'],
		'no-tabs': 'off',
		'comma-dangle': ['error', 'only-multiline'],
		semi: ['error', 'always'],
		'no-unused-vars': ['warn'],
		'space-before-function-paren': ['error', 'never'],
	},
};
