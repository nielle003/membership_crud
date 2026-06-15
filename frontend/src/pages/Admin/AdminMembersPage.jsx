import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../useAuth';
import '../../styles/AdminMembersPage.css';

const API_URL = process.env.REACT_APP_API_URL;


export default function AdminMembersPage() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token, logout, isAdmin } = useAuth();
    const [page, setPage] = useState(0);        // current page (skip value)
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');     // total members
    const limit = 5;
    const navigate = useNavigate();
    const totalPages = Math.ceil(total / limit);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);  // waits 300ms after user stops typing

        return () => clearTimeout(timer);  // clears previous timer on each keystroke
    }, [search]);

    useEffect(() => {
        loadMembers();
        console.log('Loading members with search:', debouncedSearch);
    }, [page, debouncedSearch]);


    const loadMembers = async () => {
        const res = await fetch(`${API_URL}/api/admin/members?skip=${page}&limit=${limit}&search=${debouncedSearch}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            setError('Failed to load members');
            setLoading(false);
            return;
        }

        const data = await res.json();
        setTotal(data.total);
        setMembers(data.members);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This cannot be undone.')) return;

        try {
            const res = await fetch(`${API_URL}/api/admin/members/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to delete account');
            loadMembers();
        } catch (err) {
            setError(err.message);
        }
        loadMembers();
    };
    return (
        <div className='admin-members-container'>
            <h1>Admin - Manage Members</h1>
            {loading && <div>Loading...</div>}
            {error && <div className='error'>{error}</div>}

            <header className="header-header">
                <button onClick={() => navigate('/admin/members/add')} className="btn-addmember">
                    Add Member
                </button>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    />
                </div>
                <button onClick={() => { logout(); navigate('/login'); }} className="btn-logout">
                    Logout
                </button>
            </header>
            <table className='members-table'>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
                        <th>Id</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map(m => (
                        <tr key={m.id}>
                            <td>{m.id}</td>
                            <td>{m.full_name}</td>
                            <td>{m.email}</td>
                            <td>{m.phone}</td>
                            <td>
                                <button onClick={() => navigate(`/admin/members/${m.id}/edit`)}>Edit</button>
                                <button onClick={() => handleDelete(m.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="pagination">
                <button disabled={page === 0} onClick={() => setPage(page - limit)}>
                    Previous
                </button>
                <span>Page {page / limit + 1} of {totalPages}</span>
                <button disabled={page + limit >= total} onClick={() => setPage(page + limit)}>
                    Next
                </button>
            </div>
        </div>
    );
};