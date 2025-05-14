import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const MapManagementPage = () => {
	const { currentSite } = useData();
	const [serverIp, setServerIp] = useState(currentSite?.serverIp || '');
	const [serverPort, setServerPort] = useState(
		currentSite?.serverPort || 48300
	);
	const [mapFile, setMapFile] = useState(null);
	const [message, setMessage] = useState('');

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file && file.name.endsWith('.dxf')) {
			setMapFile(file);
			setMessage('Mappa caricata localmente.');
		} else {
			setMessage('Formato file non valido.');
		}
	};

	const handleSave = () => {
		setMessage('Salvataggio in corso... (Mock)');
		setTimeout(() => setMessage('Configurazione salvata con successo!'), 1000);
	};

	return (
		<div className='p-6'>
			<h1 className='text-2xl font-semibold mb-4'>Gestione Mappa</h1>
			<div className='bg-white p-4 rounded shadow space-y-4'>
				<div>
					<label className='block mb-1 font-medium'>Carica file DXF:</label>
					<input type='file' accept='.dxf' onChange={handleFileChange} />
					{mapFile && (
						<p className='mt-2 text-sm text-green-600'>
							File selezionato: {mapFile.name}
						</p>
					)}
				</div>
				<div>
					<label className='block mb-1 font-medium'>Indirizzo IP Server:</label>
					<input
						className='w-full p-2 border rounded'
						value={serverIp}
						onChange={(e) => setServerIp(e.target.value)}
					/>
				</div>
				<div>
					<label className='block mb-1 font-medium'>Porta Server:</label>
					<input
						type='number'
						className='w-full p-2 border rounded'
						value={serverPort}
						onChange={(e) => setServerPort(e.target.value)}
					/>
				</div>
				<button
					onClick={handleSave}
					className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
				>
					Salva Configurazione
				</button>
				{message && (
					<div className='mt-4 text-green-700 font-medium'>{message}</div>
				)}
			</div>
		</div>
	);
};

export default MapManagementPage;
