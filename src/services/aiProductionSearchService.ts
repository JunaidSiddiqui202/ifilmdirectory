import { type UserProfile } from './userService';
import { type Facility } from './facilityService';
import { generateText } from './groqService';

export type AgeBracket = 'child' | 'young' | 'middle' | 'senior' | 'all';

export interface ParsedProductionQuery {
    isNaturalAIQuery: boolean;
    isProductionPackage: boolean; // e.g. "whole cast and crew", "complete crew", "build team", "set cast and crew for small budget movie"
    isAgeSpecific: boolean;
    targetAgeRange?: { min: number; max: number; label: string };
    characterArchetype?: string; // "lead", "villain", "grandfather", "hero", "heroine", "child", etc.
    requestedCrafts: string[]; // ['actor', 'director', 'ad', 'dop', 'editor', 'lyricist', 'sound', 'stunt', 'art']
    locationQuery?: {
        requested: boolean;
        type?: string; // 'old house', 'house', 'villa', 'studio', etc.
        maxBudget?: number; // e.g. 25000
        nearMe?: boolean;
        city?: string;
    };
    isLowBudget?: boolean;
    targetDate?: {
        raw: string;
        formatted?: string;
    };
    aiSummary?: string;
}

export interface ProductionPackageResult {
    query: string;
    parsed: ParsedProductionQuery;
    aiRecommendation?: string;
    cast: {
        youngLeads: UserProfile[]; // Age 18-32
        characterArtists: UserProfile[]; // Age 33-50
        seniorArtists: UserProfile[]; // Age 50+
        childArtists: UserProfile[]; // Age < 18
        allMatchingCast: UserProfile[];
    };
    crew: {
        direction: UserProfile[]; // Director, AD, Associate
        camera: UserProfile[]; // DOP, Cameraman, Focus Puller
        postProduction: UserProfile[]; // Editor, Colorist, Sound Designer
        writingAndMusic: UserProfile[]; // Screenwriter, Lyricist, Composer
        artAndStunts: UserProfile[]; // Art Director, Stunt Master, Costume
    };
    locationsAndStudios: {
        matching: Facility[];
        budgetMatchedCount: number;
        underBudgetLocations: Facility[];
    };
}

// 1. EXTRACT NUMERIC PRICE FROM FACILITY PRICE STRING (e.g. "₹22,000/day" -> 22000)
export function parseFacilityPrice(priceStr?: string): number | null {
    if (!priceStr) return null;
    const clean = priceStr.replace(/,/g, '');
    const match = clean.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

// 2. INFER ACTOR AGE OR AGE BRACKET FROM PROFILE
export function inferActorAge(user: UserProfile): { age: number | null; bracket: AgeBracket } {
    const bio = (user.bio || '').toLowerCase();
    const role = (user.role || '').toLowerCase();
    const customRole = (user.customRole || '').toLowerCase();

    // A. Check for explicit age mentions in bio (e.g. "24 years old", "age 28", "26 yo")
    const ageMatch = bio.match(/\b(?:age|aged)\s*[:=-]?\s*(\d{1,2})\b/i) ||
        bio.match(/\b(\d{1,2})\s*(?:years\s*old|yrs\s*old|yo)\b/i);
    
    if (ageMatch) {
        const age = parseInt(ageMatch[1], 10);
        if (age < 18) return { age, bracket: 'child' };
        if (age <= 33) return { age, bracket: 'young' };
        if (age <= 50) return { age, bracket: 'middle' };
        return { age, bracket: 'senior' };
    }

    // B. Check birth year (e.g. "born 1998", "born in 2002")
    const birthMatch = bio.match(/\bborn\s*(?:in)?\s*(19\d{2}|20\d{2})\b/i);
    if (birthMatch) {
        const birthYear = parseInt(birthMatch[1], 10);
        const age = new Date().getFullYear() - birthYear;
        if (age < 18) return { age, bracket: 'child' };
        if (age <= 33) return { age, bracket: 'young' };
        if (age <= 50) return { age, bracket: 'middle' };
        return { age, bracket: 'senior' };
    }

    // C. Keyword heuristics in bio / custom role
    const text = `${bio} ${role} ${customRole}`;
    if (/\b(child\s*artist|kid\s*artist|child\s*actor|little\s*boy|little\s*girl|school\s*student)\b/i.test(text)) {
        return { age: 12, bracket: 'child' };
    }
    if (/\b(senior\s*artist|veteran|grandfather|grandpa|grandmother|old\s*man|old\s*woman|elderly|60\+|55\+)\b/i.test(text)) {
        return { age: 60, bracket: 'senior' };
    }
    if (/\b(middle\s*aged|father\s*role|mother\s*role|villain|police\s*officer|antagonist|40s|35\+)\b/i.test(text)) {
        return { age: 42, bracket: 'middle' };
    }
    if (/\b(hero|heroine|young\s*lead|fresher|debutant|college|youth|20s)\b/i.test(text)) {
        return { age: 24, bracket: 'young' };
    }

    // Default distribution: if experience > 15 years -> middle/senior
    const expCount = (user.experience || []).length;
    if (expCount >= 5) return { age: 45, bracket: 'middle' };
    
    // Default fallback
    return { age: 26, bracket: 'young' };
}

// 3. PARSE NATURAL LANGUAGE QUERY (ChatGPT / LLM style intent parser)
export function parseNaturalProductionQuery(rawQuery: string): ParsedProductionQuery {
    const q = rawQuery.trim().toLowerCase();
    
    // Test if query is an AI natural language request / production package assembly
    const isPackageQuery = /\b(whole|all|complete|full|set|assemble|build|package|roster|crew\s*list)\s*(cast\s*and\s*crew|cast|crew|team|production|members)?\b/i.test(q) ||
        /\b(give\s*me|show\s*me|build|assemble|make|set\s*up|hire|find|arrange)\s*(a|an|the)?\s*(film|movie|cast|crew|team|production|unit)\b/i.test(q) ||
        /\b(cast\s*and\s*crew|small\s*budget\s*movie|indie\s*film|feature\s*film\s*crew|low\s*budget)\b/i.test(q);

    const isLowBudget = /\b(small\s*budget|low\s*budget|budget\s*friendly|affordable|cheap|indie|micro\s*budget)\b/i.test(q);

    // Extract Date / Calendar queries (e.g. "15th nov", "15 nov", "15th november", "tomorrow", "december 20")
    let targetDate: { raw: string; formatted?: string } | undefined;
    const dateMatch = q.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i) ||
        q.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{1,2})(?:st|nd|rd|th)?\b/i);

    if (dateMatch) {
        targetDate = {
            raw: dateMatch[0],
            formatted: dateMatch[0].toUpperCase()
        };
    } else if (/\b(available\s*now|available\s*today|tomorrow|this\s*weekend)\b/i.test(q)) {
        targetDate = {
            raw: 'immediately available',
            formatted: 'Available Now'
        };
    }

    // Extract Age Constraints
    let isAgeSpecific = false;
    let targetAgeRange: { min: number; max: number; label: string } | undefined;

    // Pattern: "20 to 25", "20-25 age", "age 20-30", "between 25 and 35"
    const rangeMatch = q.match(/\b(?:age\s*)?(\d{1,2})\s*(?:to|-|and)\s*(\d{1,2})(?:\s*age|\s*years)?\b/i);
    if (rangeMatch) {
        const min = parseInt(rangeMatch[1], 10);
        const max = parseInt(rangeMatch[2], 10);
        isAgeSpecific = true;
        targetAgeRange = { min, max, label: `${min}-${max} years` };
    } else if (/\b(child|kid|children|under\s*15|under\s*18)\b/i.test(q)) {
        isAgeSpecific = true;
        targetAgeRange = { min: 5, max: 17, label: 'Child / Kids (<18)' };
    } else if (/\b(young|hero|heroine|youth|lead|college|20s)\b/i.test(q)) {
        isAgeSpecific = true;
        targetAgeRange = { min: 18, max: 32, label: 'Young Leads (18–32)' };
    } else if (/\b(middle\s*aged|father|mother|villain|police|40s)\b/i.test(q)) {
        isAgeSpecific = true;
        targetAgeRange = { min: 33, max: 50, label: 'Middle-Aged / Antagonists (33–50)' };
    } else if (/\b(senior|veteran|grandfather|grandma|old\s*man|old\s*woman|60\+|50\+)\b/i.test(q)) {
        isAgeSpecific = true;
        targetAgeRange = { min: 50, max: 80, label: 'Senior / Veteran Artists (50+)' };
    }

    // Extract Character Archetype
    let characterArchetype: string | undefined;
    if (/\bheroine\b/i.test(q)) characterArchetype = 'Female Lead (Heroine)';
    else if (/\bhero\b/i.test(q)) characterArchetype = 'Male Lead (Hero)';
    else if (/\bvillain\b/i.test(q)) characterArchetype = 'Antagonist (Villain)';
    else if (/\bgrandfather|grandpa\b/i.test(q)) characterArchetype = 'Grandfather Character';
    else if (/\bfather\b/i.test(q)) characterArchetype = 'Father Character';
    else if (/\bmother\b/i.test(q)) characterArchetype = 'Mother Character';
    else if (/\bchild\s*artist|kid\b/i.test(q)) characterArchetype = 'Child Artist';

    // Extract Budget Constraints (e.g. "25k budget", "under 25k", "budget 25000", "25,000", "small budget")
    let maxBudget: number | undefined;
    const kMatch = q.match(/\b(\d+)\s*k\s*(?:budget)?\b/i) || q.match(/\bbudget\s*(?:of\s*)?(\d+)\s*k\b/i);
    if (kMatch) {
        maxBudget = parseInt(kMatch[1], 10) * 1000;
    } else {
        const fullNumberMatch = q.match(/\b(?:budget\s*(?:of\s*)?|under\s*)(\d{4,6})\b/i) ||
            q.match(/\b(\d{4,6})\s*(?:budget|inr|rs|rupees)\b/i);
        if (fullNumberMatch) {
            maxBudget = parseInt(fullNumberMatch[1], 10);
        } else if (isLowBudget) {
            maxBudget = 30000; // Small budget movie default ceiling for studios/facilities
        }
    }

    // Extract Location & Studio criteria (e.g. "old house near me", "villa under 25k")
    const isLocationQuery = /\b(old\s*house|house|villa|bungalow|haveli|location|courtroom|police\s*station|shooting\s*floor|studio|dubbing)\b/i.test(q);
    const nearMe = /\b(near\s*me|nearby|around\s*here|closest|local|in\s*my\s*city)\b/i.test(q);
    
    let locationType: string | undefined;
    if (/\b(old\s*house|traditional\s*house|vintage\s*house|haveli)\b/i.test(q)) locationType = 'Old House / Heritage';
    else if (/\bvilla|bungalow\b/i.test(q)) locationType = 'Villa / Bungalow';
    else if (/\bcourtroom|police\s*station\b/i.test(q)) locationType = 'Courtroom / Police Set';
    else if (/\bdubbing|recording\b/i.test(q)) locationType = 'Dubbing / Sound Suite';
    else if (/\bfloor|studio\b/i.test(q)) locationType = 'Shooting Floor / Studio';

    let city: string | undefined;
    if (/\bhyderabad\b/i.test(q)) city = 'Hyderabad';
    else if (/\bchennai\b/i.test(q)) city = 'Chennai';
    else if (/\bbangalore|bengaluru\b/i.test(q)) city = 'Bangalore';
    else if (/\bmumbai\b/i.test(q)) city = 'Mumbai';

    // Extract Requested Crafts
    const requestedCrafts: string[] = [];
    if (/\b(actor|actress|cast|hero|heroine|artist)\b/i.test(q) || isPackageQuery) requestedCrafts.push('actor');
    if (/\b(director|filmmaker)\b/i.test(q) || isPackageQuery) requestedCrafts.push('director');
    if (/\b(ad|assistant\s*director|associate\s*director)\b/i.test(q) || isPackageQuery) requestedCrafts.push('ad');
    if (/\b(dop|cameraman|cinematographer|camera\s*operator)\b/i.test(q) || isPackageQuery) requestedCrafts.push('dop');
    if (/\b(editor|editors|colorist|editing)\b/i.test(q) || isPackageQuery) requestedCrafts.push('editor');
    if (/\b(lyricist|lyric\s*writer|songwriter)\b/i.test(q) || isPackageQuery) requestedCrafts.push('lyricist');
    if (/\b(writer|screenwriter|dialogue\s*writer)\b/i.test(q) || isPackageQuery) requestedCrafts.push('writer');
    if (/\b(sound|audiographer|sound\s*designer)\b/i.test(q) || isPackageQuery) requestedCrafts.push('sound');
    if (/\b(music\s*director|composer|music)\b/i.test(q) || isPackageQuery) requestedCrafts.push('music_director');
    if (/\b(stunt|fight\s*master|action)\b/i.test(q) || isPackageQuery) requestedCrafts.push('stunt');
    if (/\b(art\s*director|production\s*designer)\b/i.test(q) || isPackageQuery) requestedCrafts.push('art');

    const isNaturalAIQuery = isPackageQuery || isAgeSpecific || !!maxBudget || nearMe || !!characterArchetype || !!targetDate || isLowBudget || q.split(/\s+/).length >= 3;

    return {
        isNaturalAIQuery,
        isProductionPackage: isPackageQuery,
        isAgeSpecific,
        targetAgeRange,
        characterArchetype,
        requestedCrafts,
        isLowBudget,
        targetDate,
        locationQuery: isLocationQuery || maxBudget || nearMe ? {
            requested: true,
            type: locationType,
            maxBudget,
            nearMe,
            city
        } : undefined
    };
}

// 4. GENERATE COMPLETE PRODUCTION BREAKDOWN & MATCHED DATASETS
export async function buildAIProductionPackage(
    rawQuery: string,
    allUsers: UserProfile[],
    allFacilities: Facility[],
    _userCoords?: { lat: number; lng: number } | null
): Promise<ProductionPackageResult> {
    const parsed = parseNaturalProductionQuery(rawQuery);

    // A. Filter & Categorize Cast by Age
    const actorsList = allUsers.filter(u => {
        const r = (u.role || '').toLowerCase();
        const c = (u.customRole || '').toLowerCase();
        const b = (u.bio || '').toLowerCase();
        return r.includes('actor') || r.includes('artist') || r.includes('cast') ||
            c.includes('actor') || c.includes('artist') || b.includes('actor') || b.includes('artist');
    });

    const youngLeads: UserProfile[] = [];
    const characterArtists: UserProfile[] = [];
    const seniorArtists: UserProfile[] = [];
    const childArtists: UserProfile[] = [];

    actorsList.forEach(u => {
        const { age, bracket } = inferActorAge(u);

        // If a specific age range was requested (e.g. 20-25)
        if (parsed.targetAgeRange && age !== null) {
            if (age >= parsed.targetAgeRange.min && age <= parsed.targetAgeRange.max) {
                if (bracket === 'child') childArtists.push(u);
                else if (bracket === 'young') youngLeads.push(u);
                else if (bracket === 'middle') characterArtists.push(u);
                else seniorArtists.push(u);
                return;
            }
        }

        if (bracket === 'child') childArtists.push(u);
        else if (bracket === 'young') youngLeads.push(u);
        else if (bracket === 'middle') characterArtists.push(u);
        else seniorArtists.push(u);
    });

    // B. Filter Crew by Departments
    const directionCrew = allUsers.filter(u => {
        const r = (u.role || '').toLowerCase();
        const c = (u.customRole || '').toLowerCase();
        return r.includes('director') || c.includes('director') || r === 'ad' || c === 'ad';
    });

    const cameraCrew = allUsers.filter(u => {
        const r = (u.role || '').toLowerCase();
        const c = (u.customRole || '').toLowerCase();
        return r.includes('cinematographer') || r.includes('dop') || r.includes('camera') ||
            c.includes('cinematographer') || c.includes('dop') || c.includes('camera');
    });

    const postCrew = allUsers.filter(u => {
        const r = (u.role || '').toLowerCase();
        const c = (u.customRole || '').toLowerCase();
        return r.includes('editor') || r.includes('colorist') || r.includes('sound') ||
            c.includes('editor') || c.includes('colorist') || c.includes('sound');
    });

    const writingMusicCrew = allUsers.filter(u => {
        const r = (u.role || '').toLowerCase();
        const c = (u.customRole || '').toLowerCase();
        return r.includes('lyricist') || r.includes('writer') || r.includes('composer') || r.includes('music') ||
            c.includes('lyricist') || c.includes('writer') || c.includes('composer');
    });

    const artStuntsCrew = allUsers.filter(u => {
        const r = (u.role || '').toLowerCase();
        const c = (u.customRole || '').toLowerCase();
        return r.includes('art') || r.includes('stunt') || r.includes('costume') || r.includes('makeup') ||
            c.includes('art') || c.includes('stunt') || c.includes('costume') || c.includes('makeup');
    });

    // C. Filter Locations & Studios by Budget and Query Type (e.g. "25k budget old house")
    const maxBudget = parsed.locationQuery?.maxBudget;
    const requestedLocType = parsed.locationQuery?.type?.toLowerCase() || '';

    let matchingLocations = allFacilities.filter(f => {
        const name = (f.name || '').toLowerCase();
        const desc = (f.description || '').toLowerCase();
        const type = (f.type || '').toLowerCase();
        const priceNum = parseFacilityPrice(f.price);

        // Filter by budget if provided
        if (maxBudget && priceNum && priceNum > maxBudget) {
            return false;
        }

        // Filter by location type if user explicitly asked for "old house" / "villa" / "studio"
        if (requestedLocType.includes('old house') || requestedLocType.includes('heritage')) {
            return name.includes('house') || name.includes('heritage') || name.includes('haveli') ||
                desc.includes('house') || desc.includes('vintage') || desc.includes('traditional') || type.includes('space');
        }
        if (requestedLocType.includes('villa') || requestedLocType.includes('bungalow')) {
            return name.includes('villa') || name.includes('bungalow') || desc.includes('bungalow') || type.includes('space');
        }
        if (requestedLocType) {
            return type.includes(requestedLocType) || name.includes(requestedLocType) || desc.includes(requestedLocType);
        }

        return true;
    });

    // Sort budget-friendly locations first
    if (maxBudget) {
        matchingLocations = matchingLocations.sort((a, b) => {
            const pa = parseFacilityPrice(a.price) || 999999;
            const pb = parseFacilityPrice(b.price) || 999999;
            return pa - pb;
        });
    }

    const underBudgetLocations = maxBudget
        ? matchingLocations.filter(f => {
            const p = parseFacilityPrice(f.price);
            return p !== null && p <= maxBudget;
        })
        : matchingLocations;

    // D. Call Groq / Gemini LLM for an intelligent narrative production summary if available
    let aiRecommendation = '';
    try {
        const prompt = `You are the lead Film Production Assistant for iFilmDirectory. 
A filmmaker searched: "${rawQuery}".
Found: ${youngLeads.length} young leads, ${characterArtists.length} character artists, ${seniorArtists.length} veteran artists, ${directionCrew.length} direction technicians, ${cameraCrew.length} DOPs, and ${underBudgetLocations.length} locations matching their criteria.
Generate a concise, punchy 2-sentence production recommendation for this filmmaker highlighting the best matches for their shoot.`;

        const response = await generateText(prompt, 'AI Film Production Search');
        if (response && response.text && !response.text.includes('[AI Generated Draft')) {
            aiRecommendation = response.text.trim();
        }
    } catch {
        // Fallback default recommendation
        aiRecommendation = `Here is your curated film production package matching "${rawQuery}", categorized by cast age brackets, certified technicians, and budget-matched shooting locations.`;
    }

    if (!aiRecommendation) {
        aiRecommendation = `Here is your curated film production package matching "${rawQuery}", categorized by cast age brackets, certified technicians, and budget-matched shooting locations.`;
    }

    return {
        query: rawQuery,
        parsed,
        aiRecommendation,
        cast: {
            youngLeads,
            characterArtists,
            seniorArtists,
            childArtists,
            allMatchingCast: [...youngLeads, ...characterArtists, ...seniorArtists, ...childArtists]
        },
        crew: {
            direction: directionCrew,
            camera: cameraCrew,
            postProduction: postCrew,
            writingAndMusic: writingMusicCrew,
            artAndStunts: artStuntsCrew
        },
        locationsAndStudios: {
            matching: matchingLocations,
            budgetMatchedCount: underBudgetLocations.length,
            underBudgetLocations
        }
    };
}
