import { env } from './env';

export const saveUsers = async (users) => {
	for (const user of users) {
		await fetch(`${env.backendUrl}/api/users`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(user),
		});
	}
};

export const saveAssets = async (assets) => {
	for (const asset of assets) {
		await fetch(`${env.backendUrl}/api/assets`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(asset),
		});
	}
};

export const saveAssociation = async (tagId, targetType, targetId, siteId) => {
	return fetch(`${env.backendUrl}/api/associate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ tagId, targetType, targetId, siteId }),
	});
};
