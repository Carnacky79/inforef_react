// DataContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { env } from '../services/env';
import { BlueiotClient } from '../services/blueiotClient';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
	const [sites, setSites] = useState([]);
	const [currentSite, setCurrentSite] = useState(null);
	const [tags, setTags] = useState([]);
	const [positions, setPositions] = useState({});
	const [employees, setEmployees] = useState([]);
	const [assets, setAssets] = useState([]);
	const [tagAssociations, setTagAssociations] = useState([]);

	// In modalità mock, inizializza tutto per test
	useEffect(() => {
		if (env.useMock) {
			const mockSite = {
				id: 1,
				name: 'Cantiere Milano',
				serverIp: '127.0.0.1',
				serverPort: 48300,
			};
			setSites([mockSite]);
			setCurrentSite(mockSite);
			setEmployees([{ id: 1, name: 'Mario Rossi' }]);
			setAssets([{ id: 2, name: 'Gru 002' }]);
			setTags([{ id: 'TAG001' }, { id: 'TAG002' }]);
			setTagAssociations([
				{ tagId: 'TAG001', targetType: 'employee', targetId: 1 },
			]);
		}
	}, []);

	useEffect(() => {
		if (currentSite) {
			BlueiotClient.connect();
			BlueiotClient.on('tagPosition', (data) => {
				setPositions((prev) => ({
					...prev,
					[data.tagId]: { x: data.x, y: data.y, z: data.z },
				}));
			});
		}
		return () => BlueiotClient.disconnect();
	}, [currentSite]);

	const associateTag = (tagId, targetType, targetId) => {
		const updated = tagAssociations.filter((a) => a.tagId !== tagId);
		if (targetType && targetId) {
			updated.push({ tagId, targetType, targetId });
		}
		setTagAssociations(updated);
	};

	const selectSite = (id) => {
		const site = sites.find((s) => s.id === id);
		if (site) setCurrentSite(site);
	};

	return (
		<DataContext.Provider
			value={{
				sites,
				currentSite,
				selectSite,
				employees,
				setEmployees,
				assets,
				setAssets,
				tags,
				positions,
				tagAssociations,
				associateTag,
			}}
		>
			{children}
		</DataContext.Provider>
	);
};

export const useData = () => useContext(DataContext);
