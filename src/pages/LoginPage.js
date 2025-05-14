import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	const handleLogin = async (e) => {
		e.preventDefault();
		const result = await login(username, password);
		if (result.success) {
			navigate('/dashboard');
		} else {
			setError(result.error);
		}
	};

	return (
		<div className='flex items-center justify-center h-screen bg-gray-200'>
			<div className='bg-white p-8 rounded shadow-md w-96'>
				<h2 className='text-2xl font-bold mb-6 text-center'>Login</h2>
				{error && <div className='mb-4 text-red-600'>{error}</div>}
				<form onSubmit={handleLogin}>
					<input
						type='text'
						placeholder='Username'
						className='w-full p-2 mb-4 border rounded'
						value={username}
						onChange={(e) => setUsername(e.target.value)}
					/>
					<input
						type='password'
						placeholder='Password'
						className='w-full p-2 mb-4 border rounded'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<button
						type='submit'
						className='w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700'
					>
						Accedi
					</button>
				</form>
			</div>
		</div>
	);
};

export default LoginPage;
