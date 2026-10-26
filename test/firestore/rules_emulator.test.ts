/**
 * iFilmDirectory - Real Firebase Rules Emulator Test Suite
 * 
 * Target Project: ifilmdirectory-94b82
 * Test Framework: @firebase/rules-unit-testing + Vitest
 * 
 * FAIL-FAST CONFIGURATION:
 * Strictly throws an error if the Firebase Firestore Emulator is unavailable,
 * guaranteeing that all security rules are directly evaluated against real emulator instances.
 */

import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
    initializeTestEnvironment,
    RulesTestEnvironment,
    assertSucceeds,
    assertFails
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';

const PROJECT_ID = 'ifilmdirectory-94b82';
const RULES_PATH = path.resolve(__dirname, '../../firestore.rules');

describe("Firebase Rules Unit Testing Suite (@firebase/rules-unit-testing)", () => {
    let testEnv: RulesTestEnvironment;

    beforeAll(async () => {
        const rules = fs.readFileSync(RULES_PATH, 'utf8');
        const host = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || '127.0.0.1';
        const port = parseInt(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1] || '8080', 10);

        try {
            testEnv = await initializeTestEnvironment({
                projectId: PROJECT_ID,
                firestore: {
                    rules,
                    host,
                    port
                }
            });

            // Probe emulator to verify active connectivity
            const probeContext = testEnv.authenticatedContext('probe_user');
            await getDoc(doc(probeContext.firestore(), 'config/probe')).catch(() => {});
        } catch (err: any) {
            console.error(`\n[FATAL] Firestore Emulator is not accessible on ${host}:${port}.`);
            console.error(`[FATAL] Ensure 'firebase emulators:exec' or 'npm run test:rules' is running with Java enabled.\n`);
            throw new Error(`Firestore Emulator connection failed at ${host}:${port}: ${err?.message || err}`);
        }
    });

    afterAll(async () => {
        if (testEnv) {
            await testEnv.cleanup();
        }
    });

    beforeEach(async () => {
        if (testEnv) {
            await testEnv.clearFirestore();
        }
    });

    describe("/chats/{chatId} & /chats/{chatId}/messages/{messageId}", () => {
        it("allows participant to create chat with valid participant list and creatorId", async () => {
            const aliceDb = testEnv.authenticatedContext('alice').firestore();
            const chatRef = doc(aliceDb, 'chats', 'chat_123');

            await assertSucceeds(setDoc(chatRef, {
                participants: ['alice', 'bob'],
                creatorId: 'alice',
                createdAt: new Date(),
                updatedAt: new Date()
            }));
        });

        it("REJECTS outsider from reading or writing messages in another's chat", async () => {
            await testEnv.withSecurityRulesDisabled(async (adminContext) => {
                await setDoc(doc(adminContext.firestore(), 'chats', 'chat_secret'), {
                    participants: ['alice', 'bob'],
                    creatorId: 'alice'
                });
            });

            const eveDb = testEnv.authenticatedContext('eve').firestore();
            const messageRef = doc(eveDb, 'chats/chat_secret/messages/msg_1');

            await assertFails(getDoc(doc(eveDb, 'chats', 'chat_secret')));
            await assertFails(setDoc(messageRef, {
                senderId: 'eve',
                text: 'unauthorized peek',
                createdAt: new Date()
            }));
        });

        it("REJECTS standard participant from deleting entire chat conversation", async () => {
            await testEnv.withSecurityRulesDisabled(async (adminContext) => {
                await setDoc(doc(adminContext.firestore(), 'chats', 'chat_owned_by_alice'), {
                    participants: ['alice', 'bob'],
                    creatorId: 'alice'
                });
            });

            const bobDb = testEnv.authenticatedContext('bob').firestore();
            await assertFails(deleteDoc(doc(bobDb, 'chats', 'chat_owned_by_alice')));
        });
    });

    describe("/groups/{groupId} Membership Toggle", () => {
        it("allows user to self-join public group and increments count by 1", async () => {
            await testEnv.withSecurityRulesDisabled(async (adminContext) => {
                await setDoc(doc(adminContext.firestore(), 'groups', 'group_writers'), {
                    name: 'Screenwriters Guild',
                    category: 'Writing',
                    creatorId: 'director_dan',
                    isPrivate: false,
                    members: ['director_dan'],
                    memberCount: 1
                });
            });

            const aliceDb = testEnv.authenticatedContext('alice').firestore();
            await assertSucceeds(updateDoc(doc(aliceDb, 'groups', 'group_writers'), {
                members: ['director_dan', 'alice'],
                memberCount: 2
            }));
        });

        it("REJECTS outsider adding arbitrary 3rd party into a group", async () => {
            await testEnv.withSecurityRulesDisabled(async (adminContext) => {
                await setDoc(doc(adminContext.firestore(), 'groups', 'group_camera'), {
                    name: 'Camera Dept',
                    creatorId: 'dan',
                    isPrivate: false,
                    members: ['dan'],
                    memberCount: 1
                });
            });

            const aliceDb = testEnv.authenticatedContext('alice').firestore();
            await assertFails(updateDoc(doc(aliceDb, 'groups', 'group_camera'), {
                members: ['dan', 'charlie'], // Alice attempting to insert Charlie
                memberCount: 2
            }));
        });
    });

    describe("/polls/{pollId} Tamper-Proof Voting", () => {
        it("ALLOWS valid vote and increments exactly one option", async () => {
            await testEnv.withSecurityRulesDisabled(async (adminContext) => {
                await setDoc(doc(adminContext.firestore(), 'polls', 'poll_oscars'), {
                    question: 'Best Picture Pick',
                    type: 'daily',
                    active: true,
                    voters: ['voter_1'],
                    totalVotes: 1,
                    options: [
                        { id: '1', text: 'Film A', votes: 1 },
                        { id: '2', text: 'Film B', votes: 0 }
                    ]
                });
            });

            const aliceDb = testEnv.authenticatedContext('alice').firestore();
            await assertSucceeds(updateDoc(doc(aliceDb, 'polls', 'poll_oscars'), {
                voters: ['voter_1', 'alice'],
                totalVotes: 2,
                options: [
                    { id: '1', text: 'Film A', votes: 1 },
                    { id: '2', text: 'Film B', votes: 1 }
                ]
            }));
        });

        it("REJECTS duplicate voting by same UID", async () => {
            await testEnv.withSecurityRulesDisabled(async (adminContext) => {
                await setDoc(doc(adminContext.firestore(), 'polls', 'poll_double'), {
                    question: 'Vote Once',
                    active: true,
                    voters: ['alice'],
                    totalVotes: 1,
                    options: [
                        { id: '1', text: 'A', votes: 1 },
                        { id: '2', text: 'B', votes: 0 }
                    ]
                });
            });

            const aliceDb = testEnv.authenticatedContext('alice').firestore();
            await assertFails(updateDoc(doc(aliceDb, 'polls', 'poll_double'), {
                voters: ['alice', 'alice'],
                totalVotes: 2,
                options: [
                    { id: '1', text: 'A', votes: 2 },
                    { id: '2', text: 'B', votes: 0 }
                ]
            }));
        });

        it("REJECTS options containing rogue keys or unexpected fields", async () => {
            await testEnv.withSecurityRulesDisabled(async (adminContext) => {
                await setDoc(doc(adminContext.firestore(), 'polls', 'poll_rogue'), {
                    question: 'Rogue Test',
                    active: true,
                    voters: [],
                    totalVotes: 0,
                    options: [
                        { id: '1', text: 'A', votes: 0 },
                        { id: '2', text: 'B', votes: 0 }
                    ]
                });
            });

            const bobDb = testEnv.authenticatedContext('bob').firestore();
            await assertFails(updateDoc(doc(bobDb, 'polls', 'poll_rogue'), {
                voters: ['bob'],
                totalVotes: 1,
                options: [
                    { id: '1', text: 'A', votes: 1, rogueField: true },
                    { id: '2', text: 'B', votes: 0 }
                ]
            }));
        });
    });

    describe("/notifications/{id} Impersonation and Schema Rules", () => {
        it("ALLOWS standard peer notification with valid recipient and matching senderId", async () => {
            const aliceDb = testEnv.authenticatedContext('alice').firestore();

            await assertSucceeds(addDoc(collection(aliceDb, 'notifications'), {
                userId: 'bob',
                senderId: 'alice',
                type: 'message',
                title: 'New Message',
                message: 'Hello Bob!',
                isRead: false,
                actionLink: '/messages/chat_123',
                createdAt: new Date()
            }));
        });

        it("REJECTS standard user creating 'system' type notification", async () => {
            const aliceDb = testEnv.authenticatedContext('alice').firestore();

            await assertFails(addDoc(collection(aliceDb, 'notifications'), {
                userId: 'bob',
                senderId: 'alice',
                type: 'system',
                title: 'Official Security Alert',
                message: 'Your account is suspended',
                isRead: false
            }));
        });

        it("REJECTS forged senderId impersonating another user", async () => {
            const aliceDb = testEnv.authenticatedContext('alice').firestore();

            await assertFails(addDoc(collection(aliceDb, 'notifications'), {
                userId: 'bob',
                senderId: 'admin_root', // Forged senderId
                type: 'like',
                title: 'Liked your post',
                message: 'Nice post!',
                isRead: false
            }));
        });
    });
});
