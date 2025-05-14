import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
	const { isAuthenticated, logout } = useAuth();
	if (!isAuthenticated) return null;

	return (
		<nav className='bg-blue-700 text-white shadow mb-6'>
			<div className='max-w-7xl mx-auto px-4 py-3 flex items-center justify-between'>
				<ul className='flex gap-6 items-center'>
					<li>
						<Link to='/dashboard' className='hover:underline'>
							Dashboard
						</Link>
					</li>
					<li>
						<Link to='/configuration' className='hover:underline'>
							Configurazione
						</Link>
					</li>
					<li>
						<Link to='/map-management' className='hover:underline'>
							Gestione Mappe
						</Link>
					</li>
					<li>
						<Link to='/tag-association' className='hover:underline'>
							Associa Tag
						</Link>
					</li>
				</ul>
				<button
					onClick={logout}
					className='bg-red-600 hover:bg-red-700 transition text-white px-4 py-1 rounded'
				>
					Logout
				</button>
			</div>
		</nav>
	);
};

export default Navbar;
