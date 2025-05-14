import React, { useEffect, useState } from 'react';
import { fetchUsersFromCRM, fetchAssetsFromCRM } from '../services/crmClient';
import {
	saveUsers,
	saveAssets,
	saveAssociation,
} from '../services/backendClient';
import { useData } from '../context/DataContext';

const ConfigurationPage = () => {
	const [crmUsers, setCrmUsers] = useState([]);
	const [crmAssets, setCrmAssets] = useState([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');

	const { tags, employees, assets, associateTag, currentSite } = useData();

	const importData = async () => {
		setLoading(true);
		try {
			const users = await fetchUsersFromCRM();
			const assets = await fetchAssetsFromCRM();
			await saveUsers(users);
			await saveAssets(assets);
			setCrmUsers(users);
			setCrmAssets(assets);
			setMessage('Importazione completata con successo.');
		} catch (err) {
			console.error(err);
			setMessage("Errore durante l'importazione.");
		}
		setLoading(false);
	};

	const handleAssociation = async (tagId, targetType, targetId) => {
		try {
			await saveAssociation(tagId, targetType, targetId, currentSite?.id);
			associateTag(tagId, targetType, targetId);
		} catch (err) {
			console.error("Errore nell'associazione:", err);
		}
	};

	return (
		<div className='p-6'>
			<h1 className='text-2xl font-bold mb-4'>Configurazione</h1>

			<button
				onClick={importData}
				className='bg-blue-600 text-white px-4 py-2 rounded mb-4'
			>
				{loading ? 'Importazione in corso...' : 'Importa da CRM'}
			</button>

			{message && <div className='mb-4 text-green-600'>{message}</div>}

			<div className='grid grid-cols-2 gap-4'>
				<div>
					<h2 className='text-xl font-semibold mb-2'>Utenti (CRM)</h2>
					<ul className='border rounded p-2 h-64 overflow-auto'>
						{crmUsers.map((u) => (
							<li key={u.id} className='border-b py-1'>
								{u.name} ({u.role})
							</li>
						))}
					</ul>
				</div>

				<div>
					<h2 className='text-xl font-semibold mb-2'>Asset (CRM)</h2>
					<ul className='border rounded p-2 h-64 overflow-auto'>
						{crmAssets.map((a) => (
							<li key={a.id} className='border-b py-1'>
								{a.name} ({a.type})
							</li>
						))}
					</ul>
				</div>
			</div>

			<div className='mt-8'>
				<h2 className='text-xl font-semibold mb-2'>Associazioni Tag</h2>
				<ul className='border rounded p-2 space-y-2'>
					{tags.map((tag) => (
						<li key={tag.id} className='border p-2'>
							<div className='font-medium mb-1'>Tag {tag.id}</div>
							<div className='flex space-x-2'>
								<select
									onChange={(e) =>
										handleAssociation(
											tag.id,
											'employee',
											parseInt(e.target.value)
										)
									}
									className='border rounded p-1'
								>
									<option value=''>Associa a utente</option>
									{employees.map((u) => (
										<option key={u.id} value={u.id}>
											{u.name}
										</option>
									))}
								</select>
								<select
									onChange={(e) =>
										handleAssociation(tag.id, 'asset', parseInt(e.target.value))
									}
									className='border rounded p-1'
								>
									<option value=''>Associa ad asset</option>
									{assets.map((a) => (
										<option key={a.id} value={a.id}>
											{a.name}
										</option>
									))}
								</select>
							</div>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default ConfigurationPage;
