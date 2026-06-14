import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [token, setToken] = useState(null);
    const [member_id, setMemberId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [is_admin, setIsAdmin] = useState(false);

    //check if access token is available on load

    useEffect(() => {
        const saveToken = sessionStorage.getItem('token');
        if (saveToken) {
            setToken(saveToken);
            setMemberId(sessionStorage.getItem('member_id'));
            setIsAdmin(sessionStorage.getItem('is_admin') === 'true');
        }
        setLoading(false);
    }, []);

    const login = (token, memberId, is_admin) => {
        setToken(token);
        setMemberId(memberId);
        setIsAdmin(is_admin);
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('member_id', memberId);
        sessionStorage.setItem('is_admin', is_admin.toString());
    };

    const logout = () => {
        setToken(null);
        setMemberId(null);
        setIsAdmin(false);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('member_id');
        sessionStorage.removeItem('is_admin');
    };

    return (
        <AuthContext.Provider value={{ token, member_id, loading, login, logout, is_admin }}>
            {children}
        </AuthContext.Provider>
    );

}

