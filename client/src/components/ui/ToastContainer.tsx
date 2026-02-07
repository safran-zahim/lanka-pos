import { useToast } from '../../store/useToast';
import { useSettingsStore } from '../../store/useSettingsStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const ToastContainer = () => {
    const { toasts, removeToast } = useToast();
    const toastEnabled = useSettingsStore((state) => state.toastEnabled);

    if (!toastEnabled) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] animate-slide-in
                        ${toast.type === 'success' ? 'bg-green-600' : ''}
                        ${toast.type === 'error' ? 'bg-red-600' : ''}
                        ${toast.type === 'info' ? 'bg-blue-600' : ''}
                    `}
                >
                    {toast.type === 'success' && <CheckCircle size={20} />}
                    {toast.type === 'error' && <AlertCircle size={20} />}
                    {toast.type === 'info' && <Info size={20} />}

                    <p className="flex-1 text-sm font-medium">{toast.message}</p>

                    <button onClick={() => removeToast(toast.id)} className="hover:bg-white/20 p-1 rounded">
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};
