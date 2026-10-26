import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so variables are accessible inside vi.mock hoisted closures
const { mockDb, mockDocsStore, batchOperations } = vi.hoisted(() => {
    return {
        mockDb: {},
        mockDocsStore: {} as Record<string, Record<string, unknown>>,
        batchOperations: [] as Array<Record<string, unknown>>
    };
});

vi.mock('../src/firebaseConfig', () => ({
    app: {},
    db: {},
    auth: {
        currentUser: { uid: 'director_vikram_001' }
    }
}));

vi.mock('firebase/firestore', () => {
    return {
        getFirestore: vi.fn(() => mockDb),
        collection: vi.fn((_db, ...paths) => paths.join('/')),
        doc: vi.fn((_first, ...paths) => {
            if (typeof _first === 'string') {
                const autoId = 'auto_' + Math.random().toString(36).substring(7);
                const sub = paths.length > 0 ? paths.join('/') : autoId;
                return `${_first}/${sub}`;
            }
            return paths.join('/');
        }),
        query: vi.fn((coll, ...clauses) => ({ coll, clauses })),
        where: vi.fn((field, op, val) => ({ field, op, val })),
        orderBy: vi.fn((field, dir) => ({ field, dir })),
        serverTimestamp: vi.fn(() => ({ __type: 'ServerTimestamp' })),
        Timestamp: {
            now: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
            fromDate: vi.fn((d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }))
        },
        arrayUnion: vi.fn((...items) => ({ __type: 'arrayUnion', items })),
        arrayRemove: vi.fn((...items) => ({ __type: 'arrayRemove', items })),
        writeBatch: vi.fn(() => ({
            set: vi.fn((docRef, data, options) => {
                batchOperations.push({ type: 'set', docRef, data, options });
            }),
            update: vi.fn((docRef, data) => {
                batchOperations.push({ type: 'update', docRef, data });
            }),
            commit: vi.fn(async () => {
                for (const op of batchOperations) {
                    if (op.type === 'set') {
                        const existing = mockDocsStore[op.docRef] || {};
                        const finalData = { ...op.data };
                        
                        // Handle arrayUnion / arrayRemove emulation in mock
                        if (op.data.participants && op.data.participants.__type === 'arrayUnion') {
                            const prev = existing.participants || [];
                            finalData.participants = Array.from(new Set([...prev, ...op.data.participants.items]));
                        }
                        if (op.data.unreadBy && op.data.unreadBy.__type === 'arrayUnion') {
                            const prev = existing.unreadBy || [];
                            finalData.unreadBy = Array.from(new Set([...prev, ...op.data.unreadBy.items]));
                        }
                        mockDocsStore[op.docRef] = { ...existing, ...finalData };
                    }
                }
            })
        })),
        updateDoc: vi.fn(async (docRef, data) => {
            const existing = mockDocsStore[docRef] || {};
            const finalData = { ...data };
            if (data.unreadBy && data.unreadBy.__type === 'arrayRemove') {
                const prev = existing.unreadBy || [];
                finalData.unreadBy = prev.filter((id: string) => !data.unreadBy.items.includes(id));
            }
            if (data.isRead !== undefined) {
                finalData.isRead = data.isRead;
            }
            mockDocsStore[docRef] = { ...existing, ...finalData };
        }),
        getDocs: vi.fn(async (q) => {
            const path = typeof q === 'string' ? q : q.coll;
            const matchingDocs = Object.keys(mockDocsStore)
                .filter(k => k.startsWith(path))
                .map(k => ({
                    id: k.split('/').pop(),
                    data: () => mockDocsStore[k]
                }));
            return {
                docs: matchingDocs,
                empty: matchingDocs.length === 0,
                forEach: (fn: (doc: unknown) => void) => matchingDocs.forEach(fn)
            };
        }),
        getDoc: vi.fn(async (docRef) => ({
            exists: () => !!mockDocsStore[docRef],
            id: docRef.split('/').pop(),
            data: () => mockDocsStore[docRef]
        })),
        addDoc: vi.fn(async (collPath, data) => {
            const autoId = 'auto_' + Math.random().toString(36).substring(7);
            const fullPath = `${collPath}/${autoId}`;
            mockDocsStore[fullPath] = { ...data, id: autoId };
            return { id: autoId };
        })
    };
});

// Import the actual production service modules
import { sendMessage, markChatAsRead, getChats } from '../src/services/messagingService';
import { jobService } from '../src/services/jobService';
import { groupService } from '../src/services/groupService';

describe('Actual Application Services Integration Evidence', () => {

    beforeEach(() => {
        // Clear stores and operations
        for (const k in mockDocsStore) delete mockDocsStore[k];
        batchOperations.length = 0;
        vi.clearAllMocks();
    });

    describe('1. Two-Account Messaging Lifecycle (User A -> User B)', () => {
        const userA = 'director_vikram_001';
        const userB = 'cinematographer_anbu_002';
        const chatId = `${userA}_${userB}`;

        it('User A sends message: atomically creates message and sets unreadBy = [User B]', async () => {
            // Initial chat thread
            mockDocsStore[`chats/${chatId}`] = {
                id: chatId,
                participants: [userA, userB],
                unreadBy: []
            };

            await sendMessage(
                chatId,
                {
                    text: 'Are you available for the shoot in Hyderabad starting next month?',
                    senderId: userA,
                    type: 'text'
                },
                userB,
                'Director Vikram'
            );

            // Assert parent chat metadata was updated via atomic batch
            const chatState = mockDocsStore[`chats/${chatId}`];
            expect(chatState).toBeDefined();
            expect(chatState.lastMessage).toBe('Are you available for the shoot in Hyderabad starting next month?');
            expect(chatState.lastSenderId).toBe(userA);
            expect(chatState.participants).toContain(userA);
            expect(chatState.participants).toContain(userB);

            // Verified unread state for recipient User B
            expect(chatState.unreadBy).toContain(userB);
            expect(chatState.unreadBy).not.toContain(userA);

            // Verify a message subcollection doc was created with correct recipient and read status
            const messageKeys = Object.keys(mockDocsStore).filter(k => k.startsWith(`chats/${chatId}/messages/`));
            expect(messageKeys.length).toBe(1);
            const messageDoc = mockDocsStore[messageKeys[0]];
            expect(messageDoc.senderId).toBe(userA);
            expect(messageDoc.recipientId).toBe(userB);
            expect(messageDoc.isRead).toBe(false);

            // Verify an in-app notification doc was queued for User B
            const notifKeys = Object.keys(mockDocsStore).filter(k => k.startsWith('notifications/'));
            expect(notifKeys.length).toBeGreaterThanOrEqual(1);
            const userBNotif = mockDocsStore[notifKeys[0]];
            expect(userBNotif.userId).toBe(userB);
            expect(userBNotif.metadata.chatId).toBe(chatId);
            expect(userBNotif.isRead).toBe(false);
        });

        it('User B opens chat & receives message: clears unreadBy using arrayRemove without illegal message updates', async () => {
            // Seed state where User B has an unread chat and an unread notification
            mockDocsStore[`chats/${chatId}`] = {
                id: chatId,
                participants: [userA, userB],
                unreadBy: [userB],
                lastMessage: 'Are you available for the shoot?',
                lastSenderId: userA
            };

            const notifId = 'notif_userB_unread';
            mockDocsStore[`notifications/${notifId}`] = {
                id: notifId,
                userId: userB,
                type: 'message',
                metadata: { chatId },
                actionLink: `/chat/${chatId}`,
                isRead: false
            };

            // User B marks the chat as read
            await markChatAsRead(chatId, userB);

            // Assert that User B is removed from unreadBy
            const updatedChat = mockDocsStore[`chats/${chatId}`];
            expect(updatedChat.unreadBy).not.toContain(userB);
            expect(updatedChat.unreadBy).toEqual([]);

            // Assert that User B's notification was marked as read
            const updatedNotif = mockDocsStore[`notifications/${notifId}`];
            expect(updatedNotif.isRead).toBe(true);
        });

        it('getChats returns sorted threads based on latest interaction time', async () => {
            mockDocsStore['chats/chat_1'] = {
                id: 'chat_1',
                participants: [userA, userB],
                lastMessage: 'Older talk',
                updatedAt: { seconds: 1000 }
            };
            mockDocsStore['chats/chat_2'] = {
                id: 'chat_2',
                participants: [userA, 'actor_karthik_003'],
                lastMessage: 'Newer audition call',
                updatedAt: { seconds: 5000 }
            };

            const chats = await getChats();
            expect(chats.length).toBe(2);
            expect(chats[0].id).toBe('chat_2');
            expect(chats[1].id).toBe('chat_1');
        });
    });

    describe('2. Job & Recruitment Service (jobService)', () => {
        it('createJob creates a valid job listing with timestamps and user details', async () => {
            const newJob = {
                title: 'Associate Cinematographer',
                company: 'Madras Motion Pictures',
                description: 'Looking for an experienced associate DOP with RED/ARRI proficiency.',
                requirements: '3+ years camera department experience',
                location: 'Chennai / Hyderabad',
                salary: '₹80,000 - ₹1,20,000 / month',
                deadline: '2026-12-31',
                type: 'Crew' as const,
                postedBy: 'prod_house_chennai_01'
            };

            const res = await jobService.createJob(newJob);
            expect(res).toBeDefined();
            expect(res.id).toBeDefined();

            const storedJob = mockDocsStore[`jobs/${res.id}`];
            expect(storedJob.title).toBe('Associate Cinematographer');
            expect(storedJob.company).toBe('Madras Motion Pictures');
            expect(storedJob.postedAt).toBeDefined();
        });
    });

    describe('3. Group & Community Service (groupService)', () => {
        it('getGroups returns seeded and active film community guilds', async () => {
            const groups = await groupService.getGroups();
            expect(groups.length).toBeGreaterThan(0);
            expect(groups.some(g => g.name.includes('Cinematographers'))).toBe(true);
            expect(groups.some(g => g.name.includes('Directors'))).toBe(true);
        });
    });
});
