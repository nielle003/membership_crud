import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import '../styles/Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function DashboardPage() {
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token, logout, is_admin } = useAuth();
    const navigate = useNavigate();


    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/api/members/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to load profile');

            const data = await res.json();
            setMember(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async () => {
        if (!window.confirm('Are you sure? This cannot be undone.')) return;

        try {
            const res = await fetch(`${API_URL}/api/members/${member.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to delete account');
            logout();
            navigate('/login');
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className='container'>Loading...</div>;
    if (error) return <div className='container error'>{error}</div>;
    if (!member) return <div className='container'>No Profile found</div>;

    return (
        <div className='dashboard-container'>
            <header className='dashboard-header'>
                <h1>Dashboard</h1>
                <div className='header-actions'>
                    {is_admin && (
                        <button onClick={() => navigate('/admin/members')} className="btn-admin">
                            Manage Members
                        </button>
                    )}
                    <button onClick={() => { logout(); navigate('/login'); }} className="btn-logout">
                        Logout
                    </button>
                </div>
            </header>

            <div className='profile-card'>
                <h2>Your Profile</h2>
                <div className='profile-info'>
                    <p><strong>Name:</strong>{member.full_name}</p>
                    <p><strong>Email:</strong>{member.email}</p>
                    <p><strong>Phone:</strong>{member.phone}</p>
                    <p><strong>Member Since:</strong>{new Date(member.created_at).toLocaleDateString()}</p>
                </div>

                <div className='profile-actions'>
                    <button
                        onClick={() => navigate('/edit-profile')}
                        className='btn-edit'
                    >Edit Profile</button>

                    <button onClick={handleDelete} className='btn-delete'>Delete Account</button>
                </div>
            </div>
        </div>
    );
}