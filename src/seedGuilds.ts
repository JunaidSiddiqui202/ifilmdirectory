import { db, auth } from './firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, updateDoc, doc, query, where } from 'firebase/firestore';

const DEFAULT_GUILDS = [
    {
        name: 'VFX & CGI Pros',
        slug: 'vfx-cgi',
        description: 'Elite visual effects artists and technical directors sharing the latest in simulation and rendering.',
        category: 'technical',
        icon: 'movie_filter',
        guidelines: ['No plagiarism', 'Technical secrets only', 'High-res previews required', 'Support junior artists']
    },
    {
        name: 'Cinematography Hub',
        slug: 'cinematography',
        description: 'Discussion on cameras, lenses, lighting techniques and visual storytelling.',
        category: 'technical',
        icon: 'videocam',
        guidelines: ['Share your setups', 'Frame breakdowns allowed', 'Equipment reviews only', 'Respect DP rights']
    },
    {
        name: 'Acting Studio',
        slug: 'acting',
        description: 'Practice monologues, audition tips, and character development discussions.',
        category: 'talent',
        icon: 'theater_comedy',
        guidelines: ['Self-tapes allowed', 'Constructive crit only', 'Privacy first', 'No casting gossip']
    },
    {
        name: 'Directors Guild',
        slug: 'directing',
        description: 'The visionaries corner. Discussing blocking, script interpretation, and set management.',
        category: 'creative',
        icon: 'movie_edit',
        guidelines: ['Vision docs only', 'Management tips', 'No spoiler policy', 'Collab focus']
    },
    {
        name: 'Line Producers Hub',
        slug: 'line-producers',
        description: 'Budgeting, scheduling, and production management. The backbone of every set.',
        category: 'production',
        icon: 'analytics',
        guidelines: ['Budgeting tips only', 'Vendor contacts sharing', 'Logistics focus', 'No financial leaks']
    },
    {
        name: 'Art Dept & Production Design',
        slug: 'art-department',
        description: 'Set designers, prop masters, and visionaries shaping the look of the film.',
        category: 'creative',
        icon: 'palette',
        guidelines: ['Drafting/Sketches shared', 'Material sourcing', 'Moodboard critiques', 'Prop safety first']
    },
    {
        name: 'PROs & PR Guild',
        slug: 'public-relations',
        description: 'Public relations and publicity department. Managing the image of film projects.',
        category: 'administrative',
        icon: 'campaign',
        guidelines: ['Press kit standards', 'Media relations', 'Social strategy', 'Professionalism always']
    },
    {
        name: 'Makeup & Styling Lab',
        slug: 'makeup-styling',
        description: 'SFX makeup, prosthetic artists, and costume designers.',
        category: 'creative',
        icon: 'face_retouching_natural',
        guidelines: ['Product reviews', 'SFX safety', 'Portfolio shared', 'Look-test tips']
    },
    {
        name: 'Music & Playback Studio',
        slug: 'music-playback',
        description: 'Music directors, singers, and lyricists. From scoring to playback recording.',
        category: 'creative',
        icon: 'music_note',
        guidelines: ['Demo shares allowed', 'Recording tips only', 'Lyrics copyrights respected', 'Collab focus']
    },
    {
        name: 'Post-Production Suite',
        slug: 'post-production',
        description: 'The final polish. Film editors, colorists, and sound designers sharing workflows.',
        category: 'technical',
        icon: 'content_cut',
        guidelines: ['Workflow breakdowns', 'Software tips', 'Project feedback', 'No piracy']
    },
    {
        name: 'Casting Network',
        slug: 'casting-network',
        description: 'Casting directors and talent agencies managing auditions and character searches.',
        category: 'talent',
        icon: 'person_search',
        guidelines: ['Character briefs only', 'Audition safety', 'No leaked scripts', 'Professional vetting']
    }
];

export const seedGuilds = async () => {
    try {
        // Only run seeding when an authenticated user is present
        if (!auth.currentUser) {
            return;
        }

        const guildsCol = collection(db, 'guilds');
        const postsCol = collection(db, 'guild_posts');

        // Use a timeout or simple check to avoid blocking the main thread if permissions fail
        const snapshot = await getDocs(guildsCol);

        for (const guildData of DEFAULT_GUILDS) {
            let guildId = '';
            const existingDoc = snapshot.docs.find(d => d.data().slug === guildData.slug);

            if (!existingDoc) {
                console.log(`Seeding guild: ${guildData.name}...`);
                const docRef = await addDoc(guildsCol, {
                    ...guildData,
                    memberCount: Math.floor(Math.random() * 500) + 50,
                    createdAt: serverTimestamp()
                });
                guildId = docRef.id;
            } else {
                guildId = existingDoc.id;
                // Update existing guild with new icon (migrate from emoji to Material Symbol)
                const existingIcon = existingDoc.data().icon;
                if (existingIcon !== guildData.icon) {
                    console.log(`Updating icon for ${guildData.name}: ${existingIcon} -> ${guildData.icon}`);
                    await updateDoc(doc(db, 'guilds', guildId), { icon: guildData.icon });
                }
            }

            // Now seed various posts for each guild if none exist
            const postsQuery = query(postsCol, where('guildId', '==', guildId));
            const postSnapshot = await getDocs(postsQuery);

            if (postSnapshot.empty) {
                console.log(`Seeding rich content for ${guildData.name}...`);
                const seedPosts = [
                    // 1. Standard Instructional Post
                    {
                        guildId,
                        userId: `u_${guildData.slug}_1`,
                        userName: 'Praveen Cinematic',
                        userPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&auto=format&fit=crop',
                        title: `Mastery in ${guildData.name}`,
                        content: `Welcome to the ${guildData.name}. I've been in the industry for over a decade, and my biggest advice for ${guildData.category} professionals is to never stop experimenting with new workflows. \n\nCheck out this ${guildData.category} setup from our latest feature project in Mumbai.`,
                        likes: 124,
                        commentCount: 42,
                        tags: ['ProTips', 'IndustryStandard', guildData.slug],
                        language: 'english',
                        type: 'post',
                        isPinned: true,
                        mediaUrls: [`https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1000&auto=format&fit=crop`],
                        userBadges: [{ id: 'b1', label: 'Veteran', icon: 'verified', color: 'text-amber-600', bg: 'bg-amber-50' }],
                        createdAt: serverTimestamp()
                    },
                    // 2. Interactive Poll
                    {
                        guildId,
                        userId: `u_${guildData.slug}_2`,
                        userName: 'Sarah Vision',
                        userPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop',
                        title: `Favorite ${guildData.category} Tool?`,
                        content: `Which of these tools has impacted your professional ${guildData.name} workflow the most this year?`,
                        likes: 89,
                        commentCount: 156,
                        tags: ['TechTalk', 'Poll'],
                        language: 'english',
                        type: 'poll',
                        pollData: {
                            options: [
                                { id: 'o1', text: 'Industry Standard A', votes: 45 },
                                { id: 'o2', text: 'Cloud Collaboration', votes: 112 },
                                { id: 'o3', text: 'AI-Enhanced Workflow', votes: 23 }
                            ],
                            totalVotes: 180,
                            voters: []
                        },
                        mediaUrls: [`https://images.unsplash.com/photo-1541560052-5e137f229371?q=80&w=1000&auto=format&fit=crop`],
                        userBadges: [{ id: 'b2', label: 'Expert', icon: 'stars', color: 'text-blue-600', bg: 'bg-blue-50' }],
                        createdAt: serverTimestamp()
                    },
                    // 3. AMA Session
                    {
                        guildId,
                        userId: `u_${guildData.slug}_3`,
                        userName: 'Rajiv Director',
                        userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop',
                        title: `I am a lead ${guildData.category} Specialist - AMA!`,
                        content: `Ask me anything about my journey from a junior assistant to leading projects in the ${guildData.name}. I'll be answering questions for the next 4 hours!`,
                        likes: 215,
                        commentCount: 84,
                        tags: ['AMA', 'CareerPath'],
                        language: 'english',
                        type: 'ama',
                        amaHostId: `u_${guildData.slug}_3`,
                        mediaUrls: [`https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop`],
                        userBadges: [{ id: 'b3', label: 'Top Contributor', icon: 'military_tech', color: 'text-purple-600', bg: 'bg-purple-50' }],
                        createdAt: serverTimestamp()
                    }
                ];

                for (const post of seedPosts) {
                    await addDoc(postsCol, post);
                }
            }
        }
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            console.log('Skipping guild seeding: Insufficient permissions (User likely not logged in or not admin).');
        } else {
            console.error('Error in seedGuilds:', error);
        }
    }
};

