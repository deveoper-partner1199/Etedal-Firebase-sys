import type { Metadata } from 'next';
import { Geist, Geist_Mono, Cairo, Tajawal } from 'next/font/google';
import './globals.css';
import FontAwesomeLoader from '@/components/font-awesome-loader';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

const cairo = Cairo({
    variable: '--font-cairo',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '900'],
});

const tajawal = Tajawal({
    variable: '--font-tajawal',
    subsets: ['latin'],
    weight: ['500', '700', '800'],
});

export const metadata: Metadata = {
    title: {
        default: 'منصّة اعتدال لإدارة الأهداف الاستراتيجيّة',
        template: '%s | منصّة اعتدال',
    },
    description:
        'أداة شاملة تمكِّن فريق عمل جمعية اعتدال من التخطيط الاستراتيجي وقياس أثر حفظ النعمة. لوحة مؤشرات الأداء الاستراتيجي والتشغيلي مع تحليلات تفصيلية ومتابعة الأهداف',
    keywords: [
        'جمعية اعتدال',
        'مؤشرات الأداء',
        'KPIs',
        'الأهداف الاستراتيجية',
        'الأداء التشغيلي',
        'حفظ النعمة',
        'التخطيط الاستراتيجي',
        'لوحة التحكم',
        'تقارير الأداء',
        'قياس الأثر',
    ],
    authors: [{ name: 'جمعية اعتدال' }],
    creator: 'جمعية اعتدال',
    publisher: 'جمعية اعتدال',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL('https://etedal.org.sa'),
    alternates: {
        canonical: '/',
        languages: {
            'ar-SA': '/',
        },
    },
    openGraph: {
        type: 'website',
        locale: 'ar_SA',
        url: 'https://etedal.org.sa',
        siteName: 'منصّة اعتدال',
        title: 'منصّة اعتدال لإدارة الأهداف الاستراتيجيّة',
        description: 'أداة شاملة تمكِّن فريق عمل جمعية اعتدال من التخطيط الاستراتيجي وقياس أثر حفظ النعمة',
        images: [
            {
                url: '/img/logoW.png',
                width: 1200,
                height: 630,
                alt: 'شعار جمعية اعتدال',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'منصّة اعتدال لإدارة الأهداف الاستراتيجيّة',
        description: 'أداة شاملة تمكِّن فريق عمل جمعية اعتدال من التخطيط الاستراتيجي وقياس أثر حفظ النعمة',
        images: ['/img/logoW.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/favicon.ico',
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
    },
    category: 'Business Intelligence',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='ar' dir='rtl'>
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} ${tajawal.variable} font-tajawal antialiased`}
            >
                <FontAwesomeLoader />
                {children}
            </body>
        </html>
    );
}
