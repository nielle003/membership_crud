import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../useAuth';

const API_URL = process.env.REACT_APP_API_URL;

export default function AdminAddMemberPage() {

    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { token } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        //validate passwords match

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/admin/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: formData.email,
                    full_name: formData.full_name,
                    phone: formData.phone,
                    password: formData.password
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Registration Failed');
            }

            setSuccess("Member added successfully! Redirecting...");
            setTimeout(() => navigate('/admin/members'), 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }

    }
    return (
        <div className='auth-container'>
            <div className='auth-box'>
                <h1>Register Member</h1>
                {error && <div className='error'>{error}</div>}
                {success && <div className='success'>{success}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type='text'
                        name='full_name'
                        placeholder='Full Name'
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />

                    <input
                        type='email'
                        name='email'
                        placeholder='Email'
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />

                    <input
                        type='tel'
                        name='phone'
                        placeholder='Phone (optional)'
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={loading}
                    />

                    <input
                        type='password'
                        name='password'
                        placeholder='Password'
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />

                    <input
                        type='password'
                        name='confirmPassword'
                        placeholder='Confirm Password'
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />

                    <button type='submit' disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <button onClick={() => navigate('/admin/members')} className="btn-back">
                    Back to Members
                </button>
            </div>
        </div>
    );


}