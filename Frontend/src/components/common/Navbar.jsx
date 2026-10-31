import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Menu,
    Search,
    UploadCloud,
    LogOut,
    Settings,
    ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Navbar = ({ setMobileOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/files?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
            {/* Left: Mobile hamburger & Search */}
            <div className="flex items-center gap-3 flex-1 max-w-lg">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg md:hidden cursor-pointer"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <form onSubmit={handleSearch} className="relative w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search files by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </form>
            </div>

            {/* Right: Upload Action & Profile Menu */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/upload")}
                    className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs shadow-blue-600/30 transition cursor-pointer"
                >
                    <UploadCloud className="w-4 h-4" />
                    Upload
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {user?.name ? user.name[0].toUpperCase() : "U"}
                        </div>
                        <span className="hidden lg:block text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                            {user?.name || "Account"}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                            </div>

                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    navigate("/settings");
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left"
                            >
                                <Settings className="w-4 h-4 text-slate-400" />
                                Account Settings
                            </button>

                            <button
                                onClick={async () => {
                                    setMenuOpen(false);
                                    await logout();
                                    navigate("/login");
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left border-t border-slate-100"
                            >
                                <LogOut className="w-4 h-4 text-rose-500" />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
