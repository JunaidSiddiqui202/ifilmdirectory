import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    getDoc,
    query,
    orderBy,
    where,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface Job {
    id?: string;
    title: string;
    company: string;
    description: string;
    requirements: string;
    location: string;
    salary: string;
    deadline: string;
    type: 'Job' | 'Audition' | 'Crew' | 'Post-Production';
    postedBy: string; // User ID
    postedAt: any; // Timestamp
    applicationEmail?: string;
    logo?: string; // URL to company logo
    user_details?: {
        name?: string;
        verification_tier?: 'gold' | 'blue' | 'gray';
    };
    // Audition specific optional fields
    gender?: string;
    ageRange?: string;
    shootDate?: string;
    // New fields
    daysRequired?: string;
    videoUrl?: string; // For audition script/reference or showreel
    externalLinks?: {
        imdb?: string;
        wiki?: string;
    };
}

const JOBS_COLLECTION = 'jobs';

export const jobService = {
    // Post a new job
    createJob: async (jobData: Omit<Job, 'id' | 'postedAt'>) => {
        try {
            // Remove undefined values to prevent Firestore errors
            const cleanedData: any = {};
            Object.entries(jobData).forEach(([key, value]) => {
                if (value !== undefined) {
                    cleanedData[key] = value;
                }
            });

            const docRef = await addDoc(collection(db, JOBS_COLLECTION), {
                ...cleanedData,
                postedAt: Timestamp.now()
            });

            // Automatically create a social post for this job
            try {
                const { createPost } = await import('./postService');
                const timestamp = Timestamp.now();

                let postContent = `📢 We are hiring! \n\n**${jobData.title}** at ${jobData.company}\n📍 ${jobData.location}\n💰 ${jobData.salary}\n\nApply now!`;

                if (jobData.type === 'Audition') {
                    postContent = `🎬 CASTING CALL! \n\n**${jobData.title}**\nProject: ${jobData.company}\n📍 ${jobData.location}\n👤 ${jobData.gender || 'Any'} ${jobData.ageRange ? `(${jobData.ageRange})` : ''}\n💰 ${jobData.salary}\n\nApply now!`;
                }

                await createPost({
                    author: jobData.company || 'Unknown',
                    authorId: jobData.postedBy,
                    authorImage: jobData.logo || 'https://via.placeholder.com/100',
                    role: jobData.type === 'Audition' ? 'Casting Director' : 'Recruiter',
                    content: postContent,
                    createdAt: timestamp,
                    likes: 0,
                    comments: 0,
                    authorVerified: true,
                    jobId: docRef.id,
                    deadline: jobData.deadline
                });
            } catch (postError) {
                console.error("Error creating social post for job:", postError);
            }

            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Error creating job:", error);
            return { success: false, error };
        }
    },

    // Get all jobs (with specified filter)
    getJobs: async (filterType?: string) => {
        try {
            // Fetch ALL jobs ordered by date
            const q = query(collection(db, JOBS_COLLECTION), orderBy('postedAt', 'desc'));

            const snapshot = await getDocs(q);
            const now = new Date();
            // Set now to start of today, so we can compare correctly
            now.setHours(0, 0, 0, 0);

            return snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    let postedAtDate = new Date();

                    // Normalize postedAt
                    if (data.postedAt) {
                        if (data.postedAt.toDate) {
                            postedAtDate = data.postedAt.toDate();
                        } else if (typeof data.postedAt === 'string' || typeof data.postedAt === 'number') {
                            postedAtDate = new Date(data.postedAt);
                        }
                    }

                    return {
                        id: doc.id,
                        ...data,
                        postedAt: data.postedAt, // Keep original for reference if needed
                        postedAtDate: postedAtDate // Add parsed date for sorting/filtering
                    } as Job & { postedAtDate: Date };
                })
                .filter(job => {
                    // Filter out future jobs (sanity check for bad mock data)
                    // If a job says it was posted in the future (> 5 mins from now), hide it.
                    // This fixes the issue with mock data having weird timestamps like "-15526699s ago" (which implies future)
                    const timeDiff = job.postedAtDate.getTime() - new Date().getTime();
                    if (timeDiff > 5 * 60 * 1000) { // If > 5 mins in future, it's invalid mock data
                        return false;
                    }

                    // Filter by deadline
                    if (job.deadline) {
                        const deadlineDate = new Date(job.deadline);
                        // Set deadline to END of that day to ensure it doesn't expire prematurely
                        deadlineDate.setHours(23, 59, 59, 999);

                        if (deadlineDate < now) return false;
                    }

                    // Filter by type (Client-side filtering)
                    if (filterType && filterType !== 'All') {
                        return job.type === filterType;
                    }

                    return true;
                })
                .sort((a, b) => b.postedAtDate.getTime() - a.postedAtDate.getTime()); // Strict client-side sort
        } catch (error) {
            console.error("Error fetching jobs:", error);
            return [];
        }
    },

    // Get a single job by ID
    getJobById: async (jobId: string) => {
        try {
            const docRef = doc(db, JOBS_COLLECTION, jobId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Job;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching job:", error);
            return null;
        }
    },

    // Apply for a job
    applyForJob: async (jobId: string, applicantId: string, applicantData: {
        name: string;
        email: string;
        photoURL?: string;
        role?: string;
        message?: string;
    }) => {
        try {
            // Check if already applied
            const applicationsRef = collection(db, 'job_applications');
            const existingQuery = query(
                applicationsRef,
                where('jobId', '==', jobId),
                where('applicantId', '==', applicantId)
            );
            const existing = await getDocs(existingQuery);

            if (!existing.empty) {
                return { success: false, error: 'You have already applied for this job.' };
            }

            // Save application
            await addDoc(applicationsRef, {
                jobId,
                applicantId,
                ...applicantData,
                appliedAt: Timestamp.now(),
                status: 'pending' // pending, reviewed, shortlisted, rejected
            });

            return { success: true };
        } catch (error) {
            console.error("Error applying for job:", error);
            return { success: false, error: 'Failed to submit application.' };
        }
    },

    // Check if user has already applied
    checkIfApplied: async (jobId: string, userId: string): Promise<boolean> => {
        try {
            const applicationsRef = collection(db, 'job_applications');
            const q = query(
                applicationsRef,
                where('jobId', '==', jobId),
                where('applicantId', '==', userId)
            );
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error("Error checking application:", error);
            return false;
        }
    },

    // Get applications for a job (for job creator)
    getApplicationsForJob: async (jobId: string) => {
        try {
            const applicationsRef = collection(db, 'job_applications');
            const q = query(applicationsRef, where('jobId', '==', jobId), orderBy('appliedAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching applications:", error);
            return [];
        }
    },

    // Update status of an application
    updateApplicationStatus: async (
        applicationId: string,
        newStatus: 'pending' | 'reviewed' | 'shortlisted' | 'rejected'
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const appRef = doc(db, 'job_applications', applicationId);
            await updateDoc(appRef, {
                status: newStatus,
                updatedAt: Timestamp.now()
            });
            return { success: true };
        } catch (error: any) {
            console.error("Error updating application status:", error);
            return { success: false, error: error.message || 'Failed to update status' };
        }
    },

    // Toggle job bookmark
    toggleBookmarkJob: async (jobId: string, userId: string): Promise<{ success: boolean; isBookmarked: boolean }> => {
        try {
            const savedJobsRef = collection(db, 'saved_jobs');
            const q = query(
                savedJobsRef,
                where('jobId', '==', jobId),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                // Remove bookmark
                const { deleteDoc } = await import('firebase/firestore');
                await deleteDoc(doc(db, 'saved_jobs', snapshot.docs[0].id));
                return { success: true, isBookmarked: false };
            } else {
                // Add bookmark
                await addDoc(savedJobsRef, {
                    jobId,
                    userId,
                    savedAt: Timestamp.now()
                });
                return { success: true, isBookmarked: true };
            }
        } catch (error) {
            console.error("Error toggling bookmark:", error);
            return { success: false, isBookmarked: false };
        }
    },

    // Check if job is bookmarked
    checkIfBookmarked: async (jobId: string, userId: string): Promise<boolean> => {
        try {
            const savedJobsRef = collection(db, 'saved_jobs');
            const q = query(
                savedJobsRef,
                where('jobId', '==', jobId),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error("Error checking bookmark:", error);
            return false;
        }
    },

    // Seed dummy jobs if none exist
    seedJobs: async () => {
        try {
            // Only seed if empty
            const existingQuery = query(collection(db, JOBS_COLLECTION), where('is_dummy', '==', true));
            const existingSnapshot = await getDocs(existingQuery);
            if (!existingSnapshot.empty) {
                console.log("Dummy jobs already exist, skipping seed.");
                return;
            }

            const jobs = [
                {
                    title: "2nd AC (Assistant Camera)",
                    company: "Netflix Original",
                    description: "Looking for an experienced 2nd AC for a high-budget Netflix series.",
                    requirements: "3+ years experience, Arri Alexa certification preferred.",
                    location: "Mumbai, Maharashtra",
                    salary: "₹45,000/day",
                    deadline: "2026-12-30",
                    type: "Crew",
                    postedBy: "demo_admin",
                    applicationEmail: "casting@netflix.com",
                    logo: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=100&h=100&fit=crop",
                    is_dummy: true
                },
                {
                    title: "Female Lead Actor",
                    company: "Suresh Productions",
                    description: "Casting Call for a Female Lead (Age 20-25) for an upcoming Tollywood Feature.",
                    requirements: "Fluent in Telugu, Classical Dance (Kuchipudi/Bharatanatyam).",
                    location: "Hyderabad, Telangana",
                    salary: "Negotiable",
                    deadline: "2026-07-20",
                    type: "Audition",
                    postedBy: "demo_admin",
                    applicationEmail: "casting@sureshproductions.com",
                    logo: "https://images.unsplash.com/photo-1626544827763-d516dce335ca?w=100&h=100&fit=crop",
                    is_dummy: true
                },
                {
                    title: "VFX Compositor",
                    company: "Indie Studio LA",
                    description: "Remote VFX Compositor needed for Roto and Cleanup work.",
                    requirements: "Nuke software mandatory, high-speed internet.",
                    location: "Remote / Los Angeles",
                    salary: "$500/shot",
                    deadline: "2026-08-01",
                    type: "Post-Production",
                    postedBy: "demo_admin",
                    applicationEmail: "vfx@indiefilm.la",
                    logo: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=100&h=100&fit=crop",
                    is_dummy: true
                },
                {
                    title: "Male Lead Actor",
                    company: "Dharma Productions",
                    description: "Looking for a fresh face for a lead role in an upcoming rom-com.",
                    requirements: "Age 18-24, good screen presence, fluent in Hindi.",
                    location: "Mumbai",
                    salary: "Competitive",
                    deadline: "2026-05-15",
                    type: "Audition",
                    postedBy: "demo_admin",
                    applicationEmail: "audition@dharma.com",
                    logo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
                    is_dummy: true
                }
            ];

            for (const job of jobs) {
                await addDoc(collection(db, JOBS_COLLECTION), {
                    ...job,
                    postedAt: Timestamp.now()
                });
            }
            console.log("Jobs seeded successfully");
        } catch (error) {
            console.error("Error seeding jobs:", error);
        }
    }
};
