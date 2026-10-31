import { Link } from "react-router-dom";
import { Cloud, Home } from "lucide-react";

export const NotFound = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
            <div className="max-w-md">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Cloud className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
                <h2 className="text-xl font-bold text-slate-800 mt-2">Page Not Found</h2>
                <p className="text-sm text-slate-500 mt-2">
                    The page you are looking for does not exist or has been moved.
                </p>
                <Link
                    to="/dashboard"
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20"
                >
                    <Home className="w-4 h-4" /> Back to Dashboard
                </Link>
            </div>
        </div>
    );
};
