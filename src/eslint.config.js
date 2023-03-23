const reactRecommended = require('eslint-plugin-react/configs/recommended');

module.exports = [reactRecommended, {
	files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'], rules: {
		"react/jsx-no-target-blank": "off"
	}
}];