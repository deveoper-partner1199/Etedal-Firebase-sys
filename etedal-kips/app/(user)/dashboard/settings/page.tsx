'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Monitor, Calculator, Save, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getUserProfile } from '@/lib/firebase/auth';
import { Toast } from '@/components/ui/toast';
import AchievementValueTypesTable from './AchievementValueTypesTable';
import AddAchievementValueType from './AddAchievementValueType';

interface AppSettings {
    showUnweighted: boolean;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<AppSettings>({ showUnweighted: false });
    const [isManager, setIsManager] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ message, type });
    };

    useEffect(() => {
        const loadSettings = async () => {
            try {
                // Check permissions
                const userProfile = await getUserProfile();
                const manager = userProfile?.role === 'manager' || userProfile?.role === 'مدير';
                setIsManager(manager);

                // Load settings
                if (db) {
                    const settingsRef = doc(db, 'settings', 'appSettings');
                    const settingsDoc = await getDoc(settingsRef);
                    if (settingsDoc.exists()) {
                        setSettings(settingsDoc.data() as AppSettings);
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setIsLoading(false);
                setIsCheckingPermissions(false);
            }
        };
        loadSettings();
    }, []);

    const handleSettingChange = (key: keyof AppSettings, value: boolean) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSaveSettings = async () => {
        if (!isManager) {
            showToast('ليس لديك صلاحية لتعديل الإعدادات', 'error');
            return;
        }

        if (!db) {
            showToast('Firebase غير مهيأ', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const settingsRef = doc(db, 'settings', 'appSettings');
            await setDoc(settingsRef, settings);
            showToast('تم حفظ الإعدادات بنجاح', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('حدث خطأ أثناء حفظ الإعدادات', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isCheckingPermissions || isLoading) {
        return (
            <div className='flex items-center justify-center p-12'>
                <div className='text-gray-500'>جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className='space-y-6 min-h-screen bg-[#f8faf9] p-8'>
            <div className='flex items-center justify-between mb-6'>
                <h2 className='text-dark-green font-bold text-2xl'>الإعدادات</h2>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Display Settings Card */}
                <Card className='shadow-[0_4px_20px_rgba(0,0,0,0.08)]'>
                    <CardContent className='p-6'>
                        <h3 className='font-bold text-lg mb-4 text-[#03866d] flex items-center gap-2'>
                            <Monitor className='w-5 h-5' />
                            إعدادات العرض
                        </h3>
                        <div className='flex items-center gap-4 mb-4'>
                            <Checkbox
                                id='showUnweighted'
                                checked={settings.showUnweighted}
                                onCheckedChange={(checked) => handleSettingChange('showUnweighted', checked as boolean)}
                                className='w-5 h-5'
                            />
                            <Label
                                htmlFor='showUnweighted'
                                className='text-sm font-bold text-gray-600 cursor-pointer'
                            >
                                إظهار الأهداف غير الموزونة في لوحة المعلومات
                            </Label>
                        </div>
                        {isManager && (
                            <div className='flex justify-end mt-6'>
                                <Button
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    className='bg-[linear-gradient(to_right,var(--login-main-green),var(--login-dark-green))] text-white hover:brightness-110'
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        <>
                                            <Save className='mr-2 h-4 w-4' />
                                            حفظ الإعدادات
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Achievement Value Types Card */}
                <Card className='shadow-[0_4px_20px_rgba(0,0,0,0.08)]'>
                    <CardContent className='p-6'>
                        <div className='flex items-center justify-between mb-4'>
                            <h3 className='font-bold text-lg text-[#03866d] flex items-center gap-2'>
                                <Calculator className='w-5 h-5' />
                                أنواع قيم الإنجاز
                            </h3>
                            {isManager && <AddAchievementValueType />}
                        </div>
                        <AchievementValueTypesTable />
                    </CardContent>
                </Card>
            </div>

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

