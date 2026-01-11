'use client';

import { useEffect } from 'react';

export default function FontAwesomeLoader() {
    useEffect(() => {
        // Check if Font Awesome is already loaded
        const existingLink = document.querySelector('link[href*="font-awesome"]');
        if (existingLink) {
            return;
        }

        // Create and append the Font Awesome stylesheet
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        link.integrity = 'sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==';
        link.crossOrigin = 'anonymous';
        link.referrerPolicy = 'no-referrer';
        
        // Add to head immediately - insert before other stylesheets if possible
        const firstLink = document.head.querySelector('link[rel="stylesheet"]');
        if (firstLink) {
            document.head.insertBefore(link, firstLink);
        } else {
            document.head.appendChild(link);
        }
    }, []);

    return null;
}

