// SEO Component for meta tags, Open Graph, Twitter Cards, and Structured Data
// Works with React 19 without external dependencies

import { useEffect } from 'react';

interface SEOProps {
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
}: SEOProps) => {
    const fullTitle = `${title} | iFilmDirectory`;
    const fullUrl = url || window.location.href;
    const fullImage = image.startsWith('http') ? image : `${window.location.origin}${image}`;

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
            updateMetaTag('robots', 'index, follow');
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

        // Canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', fullUrl);

    }, [fullTitle, description, fullImage, fullUrl, type, author, publishedTime, modifiedTime, keywords, noindex]);

    return null; // This component doesn't render anything
};

// Structured Data for Jobs (Schema.org)
export const JobStructuredData = ({
    title,
    description,
    company,
    location,
    salary,
    employmentType,
    datePosted,
    validThrough,
    url,
}: {
    title: string;
    description: string;
    company: string;
    location: string;
    salary?: { min: number; max: number; currency: string };
    employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'TEMPORARY' | 'INTERN';
    datePosted: string;
    validThrough?: string;
    url: string;
}) => {
    const structuredData = {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title,
        description,
        datePosted,
        validThrough: validThrough || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        employmentType,
        hiringOrganization: {
            '@type': 'Organization',
            name: company,
        },
        jobLocation: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressLocality: location,
            },
        },
        ...(salary && {
            baseSalary: {
                '@type': 'MonetaryAmount',
                currency: salary.currency,
                value: {
                    '@type': 'QuantitativeValue',
                    minValue: salary.min,
                    maxValue: salary.max,
                    unitText: 'YEAR',
                },
            },
        }),
        url,
    };

    useEffect(() => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(structuredData);
        script.id = 'job-structured-data';

        // Remove existing script if any
        const existing = document.getElementById('job-structured-data');
        if (existing) {
            existing.remove();
        }

        document.head.appendChild(script);

        return () => {
            script.remove();
        };
    }, [JSON.stringify(structuredData)]);

    return null;
};

// Structured Data for Person/Profile
export const PersonStructuredData = ({
    name,
    jobTitle,
    image,
    url,
    description,
}: {
    name: string;
    jobTitle: string;
    image: string;
    url: string;
    description?: string;
}) => {
    const structuredData = {
        '@context': 'https://schema.org/',
        '@type': 'Person',
        name,
        jobTitle,
        image,
        url,
        ...(description && { description }),
    };

    useEffect(() => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(structuredData);
        script.id = 'person-structured-data';

        const existing = document.getElementById('person-structured-data');
        if (existing) {
            existing.remove();
        }

        document.head.appendChild(script);

        return () => {
            script.remove();
        };
    }, [JSON.stringify(structuredData)]);

    return null;
};

// Structured Data for Organization
export const OrganizationStructuredData = ({
    name,
    description,
    url,
    logo,
    sameAs,
}: {
    name: string;
    description: string;
    url: string;
    logo: string;
    sameAs?: string[]; // Social media URLs
}) => {
    const structuredData = {
        '@context': 'https://schema.org/',
        '@type': 'Organization',
        name,
        description,
        url,
        logo,
        ...(sameAs && { sameAs }),
    };

    useEffect(() => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(structuredData);
        script.id = 'org-structured-data';

        const existing = document.getElementById('org-structured-data');
        if (existing) {
            existing.remove();
        }

        document.head.appendChild(script);

        return () => {
            script.remove();
        };
    }, [JSON.stringify(structuredData)]);

    return null;
};

export default SEO;
