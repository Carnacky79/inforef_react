import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
	const { isAuthenticated, logout } = useAuth();
	if (!isAuthenticated) return null;

	return (
		<nav className='bg-blue-700 text-white px-4 py-3 shadow mb-4'>
			<ul className='flex gap-4 items-center'>
				<li>
					<Link to='/dashboard'>Dashboard</Link>
				</li>
				<li>
					<Link to='/map-management'>Gestione Mappe</Link>
				</li>
				<li>
					<Link to='/tag-association'>Associa Tag</Link>
				</li>
				<li className='ml-auto'>
					<button onClick={logout} className='bg-red-600 px-3 py-1 rounded'>
						Logout
					</button>
				</li>
			</ul>
		</nav>
	);
};

export default Navbar;
