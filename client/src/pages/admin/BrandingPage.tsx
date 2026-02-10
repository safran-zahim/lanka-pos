import { useEffect, useState } from 'react';
import { Image as ImageIcon, Save, Loader } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { db } from '../../db/db';

interface BrandingPageProps {
    hideSave?: boolean;
    onSaveReady?: (save: () => Promise<void>) => void;
    onSavingChange?: (saving: boolean) => void;
}

export const BrandingPage = ({ hideSave, onSaveReady, onSavingChange }: BrandingPageProps) => {
    const { updateSetting, loadSettings, loading } = useSettingsStore();
    const [isSaving, setIsSaving] = useState(false);

    const [companyName, setCompanyName] = useState('TapLanka POS');
    const [logo, setLogo] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        const fetchBranding = async () => {
            const settings = await db.settings.toArray();
            const map = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, any>);
            setCompanyName(map.companyName || 'TapLanka POS');
            setLogo(map.companyLogo || '');
            setAddress(map.companyAddress || '');
            setPhone(map.companyPhone || '');
            setEmail(map.companyEmail || '');
            setWebsite(map.companyWebsite || '');
        };
        fetchBranding();
    }, []);

    const handleLogoUpload = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setLogo(result);
            updateSetting('companyLogo', result).catch(() => { });
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setIsSaving(true);
        onSavingChange?.(true);
        try {
            await updateSetting('companyName', companyName.trim() || 'TapLanka POS');
            await updateSetting('companyLogo', logo || '');
            await updateSetting('companyAddress', address || '');
            await updateSetting('companyPhone', phone || '');
            await updateSetting('companyEmail', email || '');
            await updateSetting('companyWebsite', website || '');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
            onSavingChange?.(false);
        }
    };

    useEffect(() => {
        if (onSaveReady) onSaveReady(handleSave);
    }, [onSaveReady, companyName, logo, address, phone, email, website]);

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center h-full">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
                    {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <ImageIcon className="text-gray-400" size={28} />
                    )}
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company Logo</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                        className="block text-sm text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">PNG/JPG up to 5MB</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                    <input
                        type="text"
                        className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                        type="text"
                        className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                        type="email"
                        className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Website</label>
                    <input
                        type="text"
                        className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <textarea
                        className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700"
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>
            </div>

            {!hideSave && (
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        {isSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Saving...' : 'Save Branding'}
                    </button>
                </div>
            )}
        </div>
    );
};
