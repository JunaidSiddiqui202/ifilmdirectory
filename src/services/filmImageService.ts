/**
 * filmImageService.ts
 * High-resolution film stills, posters, and production photos with authentic photo courtesy.
 * Integrates curated blockbuster cinema database + live Wikipedia/Wikimedia film image search.
 */

export interface FilmImageResult {
    id: string;
    title: string;
    filmTitle: string;
    imageUrl: string;
    thumbnailUrl: string;
    courtesy: string; // "Photo courtesy: Arka Media Works / S.S. Rajamouli"
    description?: string;
    year?: string;
    director?: string;
    productionHouse?: string;
    source: 'cinema-db' | 'wikipedia' | 'wikimedia';
    category?: string;
}

// Curated high-res production stills & posters for Indian & Global cinema
const CURATED_FILM_IMAGES: FilmImageResult[] = [
    // BAAHUBALI
    {
        id: 'curated_baahubali_1',
        title: 'Baahubali: The Beginning (Official Poster)',
        filmTitle: 'Baahubali',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5f/Baahubali_The_Beginning_poster.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5f/Baahubali_The_Beginning_poster.jpg',
        courtesy: 'Photo courtesy: Arka Media Works / S.S. Rajamouli',
        description: 'Prabhas in the iconic title poster holding the Shivling',
        year: '2015',
        director: 'S.S. Rajamouli',
        productionHouse: 'Arka Media Works',
        source: 'cinema-db'
    },
    {
        id: 'curated_baahubali_2',
        title: 'Baahubali 2: The Conclusion (Theatrical Visual)',
        filmTitle: 'Baahubali 2',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/93/Baahubali_2_The_Conclusion_poster.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/9/93/Baahubali_2_The_Conclusion_poster.jpg',
        courtesy: 'Photo courtesy: Arka Media Works / S.S. Rajamouli',
        description: 'Amarendra Baahubali and Devasena archery sequence',
        year: '2017',
        director: 'S.S. Rajamouli',
        productionHouse: 'Arka Media Works',
        source: 'cinema-db'
    },

    // JAILER & JAILER 2
    {
        id: 'curated_jailer_1',
        title: 'Jailer (Official Poster - Rajinikanth)',
        filmTitle: 'Jailer',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cb/Jailer_2023_Tamil_film_poster.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cb/Jailer_2023_Tamil_film_poster.jpg',
        courtesy: 'Photo courtesy: Sun Pictures / Nelson Dilipkumar',
        description: 'Superstar Rajinikanth as Tiger Muthuvel Pandian',
        year: '2023',
        director: 'Nelson Dilipkumar',
        productionHouse: 'Sun Pictures',
        source: 'cinema-db'
    },
    {
        id: 'curated_jailer_2',
        title: 'Jailer 2 (Hukum Returns - Official Announcement Visual)',
        filmTitle: 'Jailer 2',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cb/Jailer_2023_Tamil_film_poster.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cb/Jailer_2023_Tamil_film_poster.jpg',
        courtesy: 'Photo courtesy: Sun Pictures / Nelson Dilipkumar',
        description: 'Superstar Rajinikanth returning in Nelson Dilipkumar sequel',
        year: '2026',
        director: 'Nelson Dilipkumar',
        productionHouse: 'Sun Pictures',
        source: 'cinema-db'
    },

    // RRR
    {
        id: 'curated_rrr_1',
        title: 'RRR (Roar of Rebellion Poster)',
        filmTitle: 'RRR',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d7/RRR_Poster.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d7/RRR_Poster.jpg',
        courtesy: 'Photo courtesy: DVV Entertainment / S.S. Rajamouli',
        description: 'Jr NTR as Bheem & Ram Charan as Alluri Sitarama Raju',
        year: '2022',
        director: 'S.S. Rajamouli',
        productionHouse: 'DVV Entertainment',
        source: 'cinema-db'
    },

    // KALKI 2898 AD
    {
        id: 'curated_kalki_1',
        title: 'Kalki 2898 AD (Epic Sci-Fi Still)',
        filmTitle: 'Kalki 2898 AD',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Kalki_2898_AD.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Kalki_2898_AD.jpg',
        courtesy: 'Photo courtesy: Vyjayanthi Movies / Nag Ashwin',
        description: 'Prabhas, Amitabh Bachchan, and Kamal Haasan in futuristic Kashi',
        year: '2024',
        director: 'Nag Ashwin',
        productionHouse: 'Vyjayanthi Movies',
        source: 'cinema-db'
    },

    // PUSHPA
    {
        id: 'curated_pushpa_1',
        title: 'Pushpa: The Rise (Theatrical Visual)',
        filmTitle: 'Pushpa',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/75/Pushpa_The_Rise_poster.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/7/75/Pushpa_The_Rise_poster.jpg',
        courtesy: 'Photo courtesy: Mythri Movie Makers / Sukumar',
        description: 'Allu Arjun as Pushpa Raj in the Seshachalam forests',
        year: '2021',
        director: 'Sukumar',
        productionHouse: 'Mythri Movie Makers',
        source: 'cinema-db'
    },
    {
        id: 'curated_pushpa_2',
        title: 'Pushpa 2: The Rule (Official Poster)',
        filmTitle: 'Pushpa 2',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/1/11/Pushpa_2_The_Rule.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/1/11/Pushpa_2_The_Rule.jpg',
        courtesy: 'Photo courtesy: Mythri Movie Makers / Sukumar',
        description: 'Allu Arjun as Pushpa Raj commanding global syndicates',
        year: '2024',
        director: 'Sukumar',
        productionHouse: 'Mythri Movie Makers',
        source: 'cinema-db'
    },

    // SALAAR
    {
        id: 'curated_salaar_1',
        title: 'Salaar: Part 1 – Ceasefire',
        filmTitle: 'Salaar',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a6/Salaar_Part_1_%E2%80%93_Ceasefire.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a6/Salaar_Part_1_%E2%80%93_Ceasefire.jpg',
        courtesy: 'Photo courtesy: Hombale Films / Prashanth Neel',
        description: 'Prabhas in violent dystopia Khansaar',
        year: '2023',
        director: 'Prashanth Neel',
        productionHouse: 'Hombale Films',
        source: 'cinema-db'
    },

    // DEVARA
    {
        id: 'curated_devara_1',
        title: 'Devara: Part 1 (Stormy Sea Poster)',
        filmTitle: 'Devara',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Devara_Part_1.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Devara_Part_1.jpg',
        courtesy: 'Photo courtesy: Yuvasudha Arts / NTR Arts / Koratala Siva',
        description: 'Jr NTR in coastal warfare epic',
        year: '2024',
        director: 'Koratala Siva',
        productionHouse: 'Yuvasudha Arts & NTR Arts',
        source: 'cinema-db'
    },

    // KGF
    {
        id: 'curated_kgf_1',
        title: 'K.G.F: Chapter 2 (Rocky Bhai Poster)',
        filmTitle: 'KGF',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d0/K.G.F_Chapter_2.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d0/K.G.F_Chapter_2.jpg',
        courtesy: 'Photo courtesy: Hombale Films / Prashanth Neel',
        description: 'Yash as Rocky ruling the gold fields of Kolar',
        year: '2022',
        director: 'Prashanth Neel',
        productionHouse: 'Hombale Films',
        source: 'cinema-db'
    },

    // LEO & VIKRAM
    {
        id: 'curated_leo_1',
        title: 'Leo (Bloody Sweet Poster)',
        filmTitle: 'Leo',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/77/Leo_2023_Indian_film_poster.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/7/77/Leo_2023_Indian_film_poster.jpg',
        courtesy: 'Photo courtesy: Seven Screen Studio / Lokesh Kanagaraj',
        description: 'Thalapathy Vijay as Parthiban / Leo Das',
        year: '2023',
        director: 'Lokesh Kanagaraj',
        productionHouse: 'Seven Screen Studio',
        source: 'cinema-db'
    },
    {
        id: 'curated_vikram_1',
        title: 'Vikram (Lokesh Cinematic Universe Poster)',
        filmTitle: 'Vikram',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/93/Vikram_2022_poster.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/9/93/Vikram_2022_poster.jpg',
        courtesy: 'Photo courtesy: Raaj Kamal Films International',
        description: 'Kamal Haasan, Fahadh Faasil, and Vijay Sethupathi',
        year: '2022',
        director: 'Lokesh Kanagaraj',
        productionHouse: 'Raaj Kamal Films International',
        source: 'cinema-db'
    },

    // KANTARA
    {
        id: 'curated_kantara_1',
        title: 'Kantara (Divine Legend Poster)',
        filmTitle: 'Kantara',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/8/84/Kantara_poster.jpeg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/8/84/Kantara_poster.jpeg',
        courtesy: 'Photo courtesy: Hombale Films / Rishab Shetty',
        description: 'Rishab Shetty as Shiva in folklore masterpiece',
        year: '2022',
        director: 'Rishab Shetty',
        productionHouse: 'Hombale Films',
        source: 'cinema-db'
    },

    // OPPENHEIMER & INTERSTELLAR
    {
        id: 'curated_oppenheimer_1',
        title: 'Oppenheimer (Theatrical Key Art)',
        filmTitle: 'Oppenheimer',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg',
        courtesy: 'Photo courtesy: Universal Pictures / Christopher Nolan',
        description: 'Cillian Murphy as J. Robert Oppenheimer',
        year: '2023',
        director: 'Christopher Nolan',
        productionHouse: 'Universal Pictures',
        source: 'cinema-db'
    },
    {
        id: 'curated_interstellar_1',
        title: 'Interstellar (Cosmic Exploration Key Art)',
        filmTitle: 'Interstellar',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg',
        courtesy: 'Photo courtesy: Paramount Pictures / Syncopy / Christopher Nolan',
        description: 'Matthew McConaughey exploring Gargantua black hole',
        year: '2014',
        director: 'Christopher Nolan',
        productionHouse: 'Paramount Pictures / Warner Bros',
        source: 'cinema-db'
    }
];

// Production House mappings for auto-courtesy
const PRODUCTION_CREDITS: { [filmKey: string]: string } = {
    'baahubali': 'Arka Media Works / S.S. Rajamouli',
    'jailer': 'Sun Pictures / Nelson Dilipkumar',
    'jailor': 'Sun Pictures / Nelson Dilipkumar',
    'rrr': 'DVV Entertainment / S.S. Rajamouli',
    'kalki': 'Vyjayanthi Movies / Nag Ashwin',
    'pushpa': 'Mythri Movie Makers / Sukumar',
    'salaar': 'Hombale Films / Prashanth Neel',
    'devara': 'Yuvasudha Arts / NTR Arts / Koratala Siva',
    'kgf': 'Hombale Films / Prashanth Neel',
    'leo': 'Seven Screen Studio / Lokesh Kanagaraj',
    'vikram': 'Raaj Kamal Films International / Lokesh Kanagaraj',
    'kantara': 'Hombale Films / Rishab Shetty',
    'jawan': 'Red Chillies Entertainment / Atlee',
    'pathaan': 'Yash Raj Films / Siddharth Anand',
    'stree': 'Maddock Films / Amar Kaushik',
    'ponniyin': 'Lyca Productions / Madras Talkies / Mani Ratnam',
    'indian 2': 'Lyca Productions / S. Shankar',
    'game changer': 'Sri Venkateswara Creations / S. Shankar',
    'vishwambhara': 'UV Creations',
    'thug life': 'Raaj Kamal Films International / Mani Ratnam',
    'coolie': 'Sun Pictures / Lokesh Kanagaraj',
    'oppenheimer': 'Universal Pictures / Christopher Nolan',
    'interstellar': 'Paramount Pictures / Syncopy',
    'dune': 'Warner Bros / Legendary Pictures / Denis Villeneuve',
    'avatar': '20th Century Studios / James Cameron'
};

/**
 * Searches Wikipedia's REST API for film summaries and posters
 */
async function searchWikipediaFilms(query: string): Promise<FilmImageResult[]> {
    try {
        const cleanQuery = query.trim();
        if (!cleanQuery) return [];

        // 1. Search Wikipedia pages matching query
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(cleanQuery + ' film')}&srlimit=5`;
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) return [];

        const searchData = await searchRes.json();
        const searchHits: Array<{ title: string; snippet: string }> = searchData?.query?.search || [];

        const results: FilmImageResult[] = [];

        // 2. Fetch page summary for each hit to get high-res image
        for (const hit of searchHits.slice(0, 4)) {
            try {
                const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`;
                const sumRes = await fetch(summaryUrl);
                if (!sumRes.ok) continue;

                const sumData = await sumRes.json();
                const imgSource = sumData.originalimage?.source || sumData.thumbnail?.source;
                if (!imgSource) continue;

                // Determine production credit
                let courtesy = 'Photo courtesy: Wikipedia / Production Stills';
                const lowerTitle = hit.title.toLowerCase();
                for (const [key, credit] of Object.entries(PRODUCTION_CREDITS)) {
                    if (lowerTitle.includes(key)) {
                        courtesy = `Photo courtesy: ${credit}`;
                        break;
                    }
                }

                results.push({
                    id: `wiki_${sumData.pageid || Math.random().toString(36).slice(2, 8)}`,
                    title: sumData.title,
                    filmTitle: cleanQuery,
                    imageUrl: imgSource,
                    thumbnailUrl: sumData.thumbnail?.source || imgSource,
                    courtesy,
                    description: sumData.description || hit.snippet.replace(/<[^>]*>/g, ''),
                    source: 'wikipedia'
                });
            } catch (innerErr) {
                // Continue to next result
            }
        }

        return results;
    } catch (err) {
        console.warn('Wikipedia film search failed:', err);
        return [];
    }
}

/**
 * Main Film Picture Search Engine
 * Combines curated database + live Wikipedia / Wikimedia API results.
 */
export async function searchFilmImages(query: string): Promise<FilmImageResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return CURATED_FILM_IMAGES.slice(0, 8);

    // 1. Filter curated database first for instant results
    const curatedMatches = CURATED_FILM_IMAGES.filter(img => 
        img.filmTitle.toLowerCase().includes(q) ||
        img.title.toLowerCase().includes(q) ||
        (img.director && img.director.toLowerCase().includes(q)) ||
        (img.productionHouse && img.productionHouse.toLowerCase().includes(q))
    );

    // 2. Query Wikipedia API in parallel
    const wikiMatches = await searchWikipediaFilms(query);

    // 3. Deduplicate by imageUrl
    const seenUrls = new Set<string>();
    const combined: FilmImageResult[] = [];

    for (const item of [...curatedMatches, ...wikiMatches]) {
        if (!seenUrls.has(item.imageUrl)) {
            seenUrls.add(item.imageUrl);
            combined.push(item);
        }
    }

    // 4. Fallback if empty: return relevant curated suggestions
    if (combined.length === 0) {
        return CURATED_FILM_IMAGES.slice(0, 6);
    }

    return combined;
}

/**
 * Detects film names mentioned inside headline or article text
 * e.g. "Baahubali", "Jailer 2", "Kalki 2898 AD", "Pushpa", "RRR"
 */
export function detectFilmsInText(text: string): string[] {
    if (!text || text.length < 3) return [];

    const lower = text.toLowerCase();
    const detected: string[] = [];

    const KNOWN_FILMS = [
        { key: 'baahubali 2', display: 'Baahubali 2' },
        { key: 'baahubali', display: 'Baahubali' },
        { key: 'jailer 2', display: 'Jailer 2' },
        { key: 'jailer', display: 'Jailer' },
        { key: 'jailor 2', display: 'Jailer 2' },
        { key: 'jailor', display: 'Jailer' },
        { key: 'kalki 2898 ad', display: 'Kalki 2898 AD' },
        { key: 'kalki', display: 'Kalki 2898 AD' },
        { key: 'pushpa 2', display: 'Pushpa 2: The Rule' },
        { key: 'pushpa', display: 'Pushpa' },
        { key: 'rrr', display: 'RRR' },
        { key: 'salaar', display: 'Salaar' },
        { key: 'devara', display: 'Devara' },
        { key: 'kgf', display: 'K.G.F' },
        { key: 'leo', display: 'Leo' },
        { key: 'vikram', display: 'Vikram' },
        { key: 'kantara', display: 'Kantara' },
        { key: 'jawan', display: 'Jawan' },
        { key: 'stree 2', display: 'Stree 2' },
        { key: 'ponniyin selvan', display: 'Ponniyin Selvan' },
        { key: 'game changer', display: 'Game Changer' },
        { key: 'coolie', display: 'Coolie' },
        { key: 'oppenheimer', display: 'Oppenheimer' },
        { key: 'interstellar', display: 'Interstellar' },
        { key: 'dune', display: 'Dune' }
    ];

    for (const item of KNOWN_FILMS) {
        // Match with word boundary or clean substring
        const regex = new RegExp(`\\b${item.key}\\b`, 'i');
        if (regex.test(lower)) {
            if (!detected.includes(item.display)) {
                detected.push(item.display);
            }
        }
    }

    return detected.slice(0, 4);
}
