'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface IconPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (iconClass: string) => void;
    currentIcon?: string;
}

interface FontAwesomeIcon {
    styles: string[];
    free: string[];
    search: {
        terms: string[];
    };
}

export default function IconPicker({ open, onOpenChange, onSelect, currentIcon }: IconPickerProps) {
    const [allIcons, setAllIcons] = useState<Record<string, FontAwesomeIcon> | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadIcons = async () => {
            if (allIcons) return;
            setLoading(true);
            try {
                const response = await fetch(
                    'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.4.0/metadata/icons.json'
                );
                if (!response.ok) throw new Error('Network response was not ok');
                const icons = await response.json();
                setAllIcons(icons);
            } catch (error) {
                console.error('Failed to load Font Awesome icons:', error);
                // Fallback to a small set of common icons
                setAllIcons({
                    tasks: { styles: ['solid'], free: ['solid'], search: { terms: ['task', 'list', 'checklist'] } },
                    bullseye: { styles: ['solid'], free: ['solid'], search: { terms: ['target', 'goal'] } },
                    chart: { styles: ['solid'], free: ['solid'], search: { terms: ['chart', 'graph'] } },
                    user: { styles: ['solid'], free: ['solid'], search: { terms: ['user', 'person'] } },
                    cog: { styles: ['solid'], free: ['solid'], search: { terms: ['settings', 'gear'] } },
                });
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            loadIcons();
        }
    }, [open, allIcons]);

    const filteredIcons = useMemo(() => {
        if (!allIcons) return [];
        const icons: string[] = [];

        for (const iconName in allIcons) {
            const icon = allIcons[iconName];
            if (icon.styles && icon.styles.includes('solid') && icon.free.includes('solid')) {
                if (searchTerm) {
                    const keywords = icon.search.terms.join(' ').toLowerCase();
                    const nameMatch = iconName.toLowerCase().includes(searchTerm.toLowerCase());
                    const keywordMatch = keywords.includes(searchTerm.toLowerCase());
                    if (nameMatch || keywordMatch) {
                        icons.push(iconName);
                    }
                } else {
                    icons.push(iconName);
                }
            }
        }

        return icons.sort();
    }, [allIcons, searchTerm]);

    const handleSelect = (iconName: string) => {
        onSelect(`fa-${iconName}`);
        onOpenChange(false);
        setSearchTerm('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='font-cairo w-full lg:min-w-3xl max-h-[80vh] overflow-hidden flex flex-col'>
                <DialogHeader>
                    <div className='flex items-center justify-between'>
                        <DialogTitle className='text-start text-dark-green text-xl font-bold'>اختر أيقونة</DialogTitle>
                    </div>
                </DialogHeader>

                <div className='mb-4'>
                    <Input
                        type='text'
                        placeholder='ابحث عن أيقونة (مثال: مال، سهم، chart)...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='w-full'
                    />
                </div>

                <div className='flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4'>
                    {loading ? (
                        <div className='flex items-center justify-center py-12'>
                            <div className='text-gray-500'>جاري تحميل الأيقونات...</div>
                        </div>
                    ) : filteredIcons.length === 0 ? (
                        <div className='text-center py-12 text-gray-400'>لا توجد أيقونات تطابق البحث</div>
                    ) : (
                        <div className='grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3'>
                            {filteredIcons.map((iconName) => {
                                const iconClass = `fa-${iconName}`;
                                const isSelected = currentIcon === iconClass;
                                return (
                                    <button
                                        key={iconName}
                                        type='button'
                                        onClick={() => handleSelect(iconName)}
                                        className={`flex items-center justify-center w-12 h-12 border rounded-lg transition-all ${
                                            isSelected
                                                ? 'bg-[var(--login-main-green)] text-white border-[var(--login-dark-green)] scale-110'
                                                : 'bg-gray-50 border-gray-300 hover:bg-[var(--login-main-green)] hover:text-white hover:border-[var(--login-dark-green)] hover:scale-110'
                                        }`}
                                        title={iconName}
                                    >
                                        <i className={`fa-solid fa-${iconName} text-xl`}></i>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
