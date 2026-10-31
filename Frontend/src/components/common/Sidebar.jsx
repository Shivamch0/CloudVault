import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Files,
    UploadCloud,
    Settings,
    LogOut,
    Cloud,
    HardDrive,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../api/apiClient";
import { formatBytes } from "../../utils/formatters";

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [storageStats, setStorageStats] = useState(null);

    useEffect(() => {
        const fetchStorage = async () => {
            try {
                const res = await apiClient.get("/files/stats");
                if (res.data?.data) {
                    setStorageStats(res.data.data);
                }
            } catch {
                // Ignore silent fetch error
            }
        };
        fetchStorage();
    }, []);

    const navLinks = [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/files", label: "All Files", icon: Files },
        { to: "/upload", label: "Upload Files", icon: UploadCloud },
        { to: "/settings", label: "Settings", icon: Settings },
    ];

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <>
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Brand / Logo */}
                <div>
                    <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                            <Cloud className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-lg font-bold tracking-tight text-slate-900">CloudVault</span>
                            <span className="block text-[10px] uppercase font-semibold text-blue-600 tracking-wider">AWS Storage</span>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="p-4 space-y-1">
                        {navLinks.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setMobileOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                            isActive
                                                ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`
                                    }
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* Storage Quota & User Profile Footer */}
                <div className="p-4 border-t border-slate-100 space-y-4">
                    {/* Storage progress widget */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                            <span className="flex items-center gap-1.5">
                                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                                Storage
                            </span>
                            <span className="text-slate-500">
                                {storageStats
                                    ? `${formatBytes(storageStats.totalStorageBytes)} / ${formatBytes(storageStats.storageLimitBytes)}`
                                    : "0 B / 500 MB"}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(100, storageStats?.usagePercentage || 0)}%`,
                                }}
                            />
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-400">
                            {storageStats?.usagePercentage || 0}% used of personal quota
                        </p>
                    </div>

                    {/* User info & Logout */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                {user?.name ? user.name[0].toUpperCase() : "U"}
                            </div>
                            <div className="truncate">
                                <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || "User"}</p>
                                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};
