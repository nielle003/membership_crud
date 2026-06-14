import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import '../styles/EditProfile.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function EditProfilePage() {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { token, member_id } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/api/members/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to load profile");
            const data = await res.json();

            setFormData({
                full_name: data.full_name,
                phone: data.phone || "",
                password: "",
                confirmPassword: ""
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        //check if password field is empty, if not check if password matches
        if (formData.password && formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setSubmitting(true);

        try {
            const updateData = {
                full_name: formData.full_name,
                phone: formData.phone
            };

            if (formData.password) {
                updateData.password = formData.password;
            }

            const res = await fetch(`${API_URL}/api/members/${member_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to update profile');
            }

            setSuccess("Profile updated successfully");
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className='container'>Loading...</div>;

    return (
        <div className='edit-profile-container'>
            <h1>Edit Profile</h1>
            {error && <div className='error'>{error}</div>}
            {success && <div className='success'>{success}</div>}

            <form onSubmit={handleSubmit} className='edit-form'>
                <div className='form-group'>
                    <label>Full Name</label>
                    <input
                        type='text'
                        name='full_name'
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        disabled={submitting}
                    />
                </div>

                <div className='form-group'>
                    <label>Phone</label>
                    <input
                        type='tel'
                        name='phone'
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={submitting}
                    />
                </div>

                <hr />
                <h3>Change Password (optional)</h3>
                <div className='form-group'>
                    <label>New Password</label>
                    <input
                        type='password'
                        name='password'
                        placeholder='Leave blank to keep current password'
                        value={formData.password}
                        onChange={handleChange}
                        disabled={submitting}
                    />
                </div>

                <div className='form-group'>
                    <label>Confirm Password</label>
                    <input
                        type='password'
                        name='confirmPassword'
                        placeholder='Confirm new Password'
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={submitting}
                    />
                </div>

                <div className='form-actions'>
                    <button type='submit' disabled={submitting} className='btn-save'>
                        {submitting ? 'Saving....' : "Save Changes"}
                    </button>

                    <button type='button' onClick={() => navigate('/dashboard')} disabled={submitting} className='btn-cancel'>
                        Cancel
                    </button>

                </div>


            </form>
        </div>
    );
}