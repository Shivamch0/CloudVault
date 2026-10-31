import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback(
        (message, type = "info", duration = 4000) => {
            const id = `${Date.now()}-${Math.random()}`;
            setToasts((prev) => [...prev, { id, message, type }]);

            if (duration > 0) {
                setTimeout(() => {
                    removeToast(id);
                }, duration);
            }
        },
        [removeToast]
    );

    const toast = {
        success: (msg, duration) => addToast(msg, "success", duration),
        error: (msg, duration) => addToast(msg, "error", duration),
        info: (msg, duration) => addToast(msg, "info", duration),
        warning: (msg, duration) => addToast(msg, "warning", duration),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-start p-3.5 rounded-xl shadow-lg border text-sm transition-all transform animate-in slide-in-from-bottom-2 duration-200 ${
                            t.type === "success"
                                ? "bg-white text-slate-800 border-emerald-200 shadow-emerald-500/10"
                                : t.type === "error"
                                ? "bg-white text-slate-800 border-rose-200 shadow-rose-500/10"
                                : t.type === "warning"
                                ? "bg-white text-slate-800 border-amber-200 shadow-amber-500/10"
                                : "bg-white text-slate-800 border-blue-200 shadow-blue-500/10"
                        }`}
                    >
                        <div className="shrink-0 mr-3 mt-0.5">
                            {t.type === "success" && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            )}
                            {t.type === "error" && (
                                <AlertCircle className="w-5 h-5 text-rose-500" />
                            )}
                            {t.type === "warning" && (
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                            )}
                            {t.type === "info" && <Info className="w-5 h-5 text-blue-500" />}
                        </div>
                        <div className="flex-1 font-medium leading-snug">{t.message}</div>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="shrink-0 ml-2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
