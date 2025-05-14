import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import MockBlueIOTClient from '../blueiotClient';

export const DataContext = createContext();
export function useData() {
	return useContext(DataContext);
}

export function DataProvider({ children }) {
	const { company, isAuthenticated } = useAuth();

	const [sites, setSites] = useState([]);
	const [currentSite, setCurrentSite] = useState(null);
	const [employees, setEmployees] = useState([]);
	const [assets, setAssets] = useState([]);
	const [tags, setTags] = useState([]);
	const [tagAssociations, setTagAssociations] = useState([]);
	const [positions, setPositions] = useState({});

	useEffect(() => {
		if (isAuthenticated && company) {
			setSites([
				{
					id: 1,
					name: 'Cantiere Milano',
					serverIp: '127.0.0.1',
					serverPort: 48300,
				},
			]);
		}
	}, [isAuthenticated, company]);

	useEffect(() => {
		if (currentSite) {
			setEmployees([{ id: 1, name: 'Mario Rossi' }]);
			setAssets([{ id: 2, name: 'Gru 002' }]);
			setTags([{ id: 'TAG001' }, { id: 'TAG002' }]);
			setTagAssociations([
				{ tagId: 'TAG001', targetType: 'employee', targetId: 1 },
			]);
			setPositions({});

			const client = new MockBlueIOTClient({ serverIp: currentSite.serverIp });
			client.on('tagPosition', (data) => {
				setPositions((prev) => ({
					...prev,
					[data.tagId]: { x: data.x, y: data.y, z: data.z },
				}));
			});
			client.connect();

			return () => client.disconnect();
		}
	}, [currentSite]);

	return (
		<DataContext.Provider
			value={{
				sites,
				currentSite,
				selectSite: (id) => setCurrentSite(sites.find((s) => s.id === id)),
				employees,
				assets,
				tags,
				tagAssociations,
				positions,
				associateTag: (tagId, type, id) => {
					const updated = tagAssociations.filter((a) => a.tagId !== tagId);
					if (type && id)
						updated.push({ tagId, targetType: type, targetId: id });
					setTagAssociations(updated);
				},
			}}
		>
			{children}
		</DataContext.Provider>
	);
}
