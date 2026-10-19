// SEO Component for meta tags, Open Graph, Twitter Cards, and Structured Data (JSON-LD)
// Works with React 19 without external dependencies

import { useEffect } from 'react';

export interface SEOProps {
    title: string;
    description: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'profile';
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    keywords?: string[];
    noindex?: boolean;
    structuredData?: any | any[];
}

export const SEO = ({
    title,
    description,
    image = '/logo.png',
    url,
    type = 'website',
    author,
    publishedTime,
    modifiedTime,
    keywords = [],
    noindex = false,
    structuredData,
}: SEOProps) => {
    const fullTitle = `${title} | iFilmDirectory`;
    const fullUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://ifilmdirectory.com');
    const fullImage = image.startsWith('http')
        ? image
        : `${typeof window !== 'undefined' ? window.location.origin : 'https://ifilmdirectory.com'}${image}`;

    useEffect(() => {
        // Update document title
        document.title = fullTitle;

        // Update or create meta tags
        const updateMetaTag = (name: string, content: string, property = false) => {
            const attribute = property ? 'property' : 'name';
            let element = document.querySelector(`meta[${attribute}="${name}"]`);

            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, name);
                document.head.appendChild(element);
            }

            element.setAttribute('content', content);
        };

        // Basic meta tags
        updateMetaTag('title', fullTitle);
        updateMetaTag('description', description);
        if (keywords.length > 0) {
            updateMetaTag('keywords', keywords.join(', '));
        }
        if (author) {
            updateMetaTag('author', author);
        }
        if (noindex) {
            updateMetaTag('robots', 'noindex, nofollow');
        } else {
            updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
        }

        // Open Graph tags
        updateMetaTag('og:title', fullTitle, true);
        updateMetaTag('og:description', description, true);
        updateMetaTag('og:image', fullImage, true);
        updateMetaTag('og:url', fullUrl, true);
        updateMetaTag('og:type', type, true);
        updateMetaTag('og:site_name', 'iFilmDirectory', true);

        if (publishedTime) {
            updateMetaTag('article:published_time', publishedTime, true);
        }
        if (modifiedTime) {
            updateMetaTag('article:modified_time', modifiedTime, true);
        }
        if (author) {
            updateMetaTag('article:author', author, true);
        }

        // Twitter Card tags
        updateMetaTag('twitter:card', 'summary_large_image');
        updateMetaTag('twitter:title', fullTitle);
        updateMetaTag('twitter:description', description);
        updateMetaTag('twitter:image', fullImage);
        updateMetaTag('twitter:site', '@ifilmdirectory');
        updateMetaTag('twitter:creator', '@ifilmdirectory');

        // Canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', fullUrl);

        // Dynamic JSON-LD Structured Data
        let scriptElement: HTMLScriptElement | null = null;
        if (structuredData) {
            const scriptId = 'dynamic-page-structured-data';
            const existingScript = document.getElementById(scriptId);
            if (existingScript) {
                existingScript.remove();
            }

            scriptElement = document.createElement('script');
            scriptElement.id = scriptId;
            scriptElement.type = 'application/ld+json';
            scriptElement.text = JSON.stringify(structuredData);
            document.head.appendChild(scriptElement);
        }

        return () => {
            if (scriptElement && scriptElement.parentNode) {
                scriptElement.remove();
            }
        };
    }, [fullTitle, description, fullImage, fullUrl, type, author, publishedTime, modifiedTime, keywords, noindex, structuredData]);

    return null;
};

// Structured Data for Jobs & Casting Calls (Schema.org / Google for Jobs)
export const JobStructuredData = ({
    title,
    description,
    company,
    location,
    salary,
    employmentType = 'CONTRACTOR',
    datePosted,
    validThrough,
    url,
}: {
    title: string;
    description: string;
    company: string;
    location: string;
    salary?: { min: number; max: number; currency: string } | string;
    employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'TEMPORARY' | 'INTERN';
    datePosted: string;
    validThrough?: string;
    url: string;
}) => {
    const structuredData: any = {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title,
        description,
        datePosted: datePosted || new Date().toISOString(),
        validThrough: validThrough || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        employmentType,
        hiringOrganization: {
            '@type': 'Organization',
            name: company || 'Film Production Banner',
            sameAs: 'https://ifilmdirectory.com',
            logo: 'https://ifilmdirectory.com/logo.png',
        },
        jobLocation: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressLocality: location || 'Pan-India',
                addressCountry: 'IN',
            },
        },
        url: url || (typeof window !== 'undefined' ? window.location.href : 'https://ifilmdirectory.com/jobs'),
    };

    if (salary && typeof salary === 'object' && salary.min) {
        structuredData.baseSalary = {
            '@type': 'MonetaryAmount',
            currency: salary.currency || 'INR',
            value: {
                '@type': 'QuantitativeValue',
                minValue: salary.min,
                maxValue: salary.max || salary.min,
                unitText: 'MONTH',
            },
        };
    }

    useEffect(() => {
        const scriptId = 'job-structured-data';
        const existing = document.getElementById(scriptId);
        if (existing) {
            existing.remove();
        }

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = scriptId;
        script.text = JSON.stringify(structuredData);
        document.head.appendChild(script);

        return () => {
            script.remove();
        };
    }, [JSON.stringify(structuredData)]);

    return null;
};

// Structured Data for Person / Filmmaker / Actor Profile
export const PersonStructuredData = ({
    name,
    jobTitle,
    image,
    url,
    description,
    knowsAbout,
}: {
    name: string;
    jobTitle: string;
    image?: string;
    url?: string;
    description?: string;
    knowsAbout?: string[];
}) => {
    const structuredData: any = {
        '@context': 'https://schema.org/',
        '@type': 'Person',
        name,
        jobTitle: jobTitle || 'Filmmaker',
        image: image || 'https://ifilmdirectory.com/logo.png',
        url: url || (typeof window !== 'undefined' ? window.location.href : 'https://ifilmdirectory.com'),
        ...(description && { description }),
        ...(knowsAbout && { knowsAbout }),
    };

    useEffect(() => {
        const scriptId = 'person-structured-data';
        const existing = document.getElementById(scriptId);
        if (existing) {
            existing.remove();
        }

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = scriptId;
        script.text = JSON.stringify(structuredData);
        document.head.appendChild(script);

        return () => {
            script.remove();
        };
    }, [JSON.stringify(structuredData)]);

    return null;
};

// Structured Data for Breadcrumb Navigation (Google Breadcrumb Rich Results)
export const BreadcrumbStructuredData = ({
    items,
}: {
    items: { name: string; url: string }[];
}) => {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url.startsWith('http') ? item.url : `https://ifilmdirectory.com${item.url}`,
        })),
    };

    useEffect(() => {
        const scriptId = 'breadcrumb-structured-data';
        const existing = document.getElementById(scriptId);
        if (existing) {
            existing.remove();
        }

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = scriptId;
        script.text = JSON.stringify(structuredData);
        document.head.appendChild(script);

        return () => {
            script.remove();
        };
    }, [JSON.stringify(structuredData)]);

    return null;
};

export default SEO;
