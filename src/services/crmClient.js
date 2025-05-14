import { env } from './env';

export const fetchUsersFromCRM = async () => {
	console.log('[CRM] useMock =', env.useMock);
	if (env.useMock) {
		return [
			{ id: 1, name: 'Mario Rossi', role: 'Operaio' },
			{ id: 2, name: 'Lucia Bianchi', role: 'Ingegnere' },
		];
	}
	const res = await fetch(`${env.crmUrl}/users?companyId=${env.companyId}`);
	if (!res.ok) throw new Error('Errore recupero utenti dal CRM');
	return res.json();
};

export const fetchAssetsFromCRM = async () => {
	if (env.useMock) {
		return [
			{ id: 10, name: 'Escavatore A', type: 'Macchina' },
			{ id: 11, name: 'Cassa Attrezzi', type: 'Contenitore' },
		];
	}
	const res = await fetch(`${env.crmUrl}/assets?companyId=${env.companyId}`);
	if (!res.ok) throw new Error('Errore recupero asset dal CRM');
	return res.json();
};
