import { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../api/apiClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem("cloudvault_user");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const res = await apiClient.get("/auth/me");
            if (res.data?.data) {
                setUser(res.data.data);
                localStorage.setItem("cloudvault_user", JSON.stringify(res.data.data));
            }
        } catch {
            setUser(null);
            localStorage.removeItem("cloudvault_user");
            localStorage.removeItem("cloudvault_token");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await apiClient.post("/auth/login", { email, password });
        const { user: userData, accessToken } = res.data.data;
        setUser(userData);
        if (accessToken) {
            localStorage.setItem("cloudvault_token", accessToken);
        }
        localStorage.setItem("cloudvault_user", JSON.stringify(userData));
        return userData;
    };

    const register = async (name, email, password) => {
        const res = await apiClient.post("/auth/register", { name, email, password });
        const { user: userData, accessToken } = res.data.data;
        setUser(userData);
        if (accessToken) {
            localStorage.setItem("cloudvault_token", accessToken);
        }
        localStorage.setItem("cloudvault_user", JSON.stringify(userData));
        return userData;
    };

    const logout = async () => {
        try {
            await apiClient.post("/auth/logout");
        } catch {
            // Ignore error on logout
        } finally {
            setUser(null);
            localStorage.removeItem("cloudvault_token");
            localStorage.removeItem("cloudvault_user");
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                checkAuth,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
