import React from 'react';
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth, AuthContext } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MapManagementPage from './pages/MapManagementPage';
import TagAssociationPage from './pages/TagAssociationPage';
import Navbar from './components/Navbar';

const App = () => {
	return (
		<AuthProvider>
			<DataProvider>
				<Router>
					<div className='min-h-screen bg-gray-100'>
						<Navbar />
						<Routes>
							<Route path='/login' element={<LoginPage />} />
							<Route
								path='/dashboard'
								element={
									<ProtectedRoute>
										<DashboardPage />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/map-management'
								element={
									<ProtectedRoute>
										<MapManagementPage />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/tag-association'
								element={
									<ProtectedRoute>
										<TagAssociationPage />
									</ProtectedRoute>
								}
							/>
							<Route path='*' element={<Navigate to='/login' replace />} />
						</Routes>
					</div>
				</Router>
			</DataProvider>
		</AuthProvider>
	);
};

const ProtectedRoute = ({ children }) => {
	const { isAuthenticated } = React.useContext(AuthContext);
	return isAuthenticated ? children : <Navigate to='/login' replace />;
};

export default App;
