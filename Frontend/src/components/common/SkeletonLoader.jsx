export const SkeletonCard = () => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs animate-pulse">
        <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
            <div className="w-6 h-6 bg-slate-100 rounded-full"></div>
        </div>
        <div className="h-4 bg-slate-200 rounded-md w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded-md w-1/2 mb-4"></div>
        <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
            <div className="h-3 bg-slate-100 rounded w-16"></div>
            <div className="h-3 bg-slate-100 rounded w-12"></div>
        </div>
    </div>
);

export const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-slate-100">
        <td className="py-3.5 px-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-200 rounded-lg"></div>
                <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-slate-200 rounded w-48"></div>
                    <div className="h-2.5 bg-slate-100 rounded w-24"></div>
                </div>
            </div>
        </td>
        <td className="py-3.5 px-4">
            <div className="h-3 bg-slate-100 rounded w-16"></div>
        </td>
        <td className="py-3.5 px-4">
            <div className="h-3 bg-slate-100 rounded w-12"></div>
        </td>
        <td className="py-3.5 px-4">
            <div className="h-3 bg-slate-100 rounded w-24"></div>
        </td>
        <td className="py-3.5 px-4 text-right">
            <div className="inline-block h-6 bg-slate-100 rounded w-16"></div>
        </td>
    </tr>
);

export const SkeletonStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                    <div className="w-12 h-4 bg-slate-100 rounded"></div>
                </div>
                <div className="h-7 bg-slate-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-slate-100 rounded w-28"></div>
            </div>
        ))}
    </div>
);
