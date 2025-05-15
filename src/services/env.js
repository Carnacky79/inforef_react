export const env = {
	useMock: process.env.REACT_APP_USE_MOCK_DATA === 'true',
	companyId: process.env.REACT_APP_COMPANY_ID,
	companyName: process.env.REACT_APP_COMPANY_NAME,
	adminUser: process.env.REACT_APP_ADMIN_USERNAME,
	adminHash: process.env.REACT_APP_ADMIN_PASSWORD_HASH,
	crmUrl: process.env.REACT_APP_CRM_BASE_URL,
	backendUrl: process.env.REACT_APP_BACKEND_URL,
	blueiotHost: process.env.REACT_APP_BLUEIOT_HOST,
	blueiotUsername: process.env.REACT_APP_BLUEIOT_USERNAME,
	blueiotPassword: process.env.REACT_APP_BLUEIOT_PASSWORD,
};

console.log('[ENV]', {
	adminUser: process.env.REACT_APP_ADMIN_USERNAME,
	adminHash: process.env.REACT_APP_ADMIN_PASSWORD_HASH,
});
