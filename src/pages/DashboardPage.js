import React, { useEffect } from 'react';
import { useData } from '../context/DataContext';

const DashboardPage = () => {
	const {
		sites,
		currentSite,
		selectSite,
		employees,
		assets,
		tags,
		tagAssociations,
		positions,
	} = useData();

	useEffect(() => {
		if (!currentSite && sites.length > 0) {
			selectSite(sites[0].id);
		}
	}, [currentSite, sites, selectSite]);

	const countByType = (type) =>
		tagAssociations.filter((a) => a.targetType === type).length;
	const countUnassociated = () =>
		tags.filter((t) => !tagAssociations.find((a) => a.tagId === t.id)).length;

	return (
		<div className='p-6'>
			<h1 className='text-2xl font-semibold mb-4'>
				Dashboard - {currentSite?.name}
			</h1>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<div className='bg-white p-4 rounded shadow'>
					<h2 className='text-lg font-medium'>Dipendenti Presenti</h2>
					<p className='text-2xl'>{countByType('employee')}</p>
				</div>
				<div className='bg-white p-4 rounded shadow'>
					<h2 className='text-lg font-medium'>Asset Tracciati</h2>
					<p className='text-2xl'>{countByType('asset')}</p>
				</div>
				<div className='bg-white p-4 rounded shadow'>
					<h2 className='text-lg font-medium'>Tag Disponibili</h2>
					<p className='text-2xl'>{countUnassociated()}</p>
				</div>
			</div>
			<div className='mt-8'>
				<h2 className='text-lg font-medium mb-2'>Posizioni in tempo reale</h2>
				<div className='bg-white p-4 rounded shadow'>
					{Object.entries(positions).map(([tagId, pos]) => {
						const association = tagAssociations.find((a) => a.tagId === tagId);
						if (!association)
							return <div key={tagId}>Tag {tagId} non associato</div>;
						const entity =
							association.targetType === 'employee'
								? employees.find((e) => e.id === association.targetId)
								: assets.find((a) => a.id === association.targetId);
						return (
							<div key={tagId} className='border-b py-2'>
								<strong>{tagId}</strong> → {entity?.name || 'Non associato'} @ (
								{pos.x.toFixed(2)}, {pos.y.toFixed(2)})
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default DashboardPage;
