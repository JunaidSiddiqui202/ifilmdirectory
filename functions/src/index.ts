/**
 * Cloud Functions for iFilmDirectory
 * 
 * This file contains Firebase Cloud Functions that handle:
 * - Push notifications for all user activities
 * - Admin notifications
 * - Like, comment, follow, and connection notifications
 * 
 * Cost Optimization Features:
 * - Minimum memory allocation (256MB)
 * - Short timeouts (60s max)
 * - No automatic retries on failure
 * - Efficient error handling
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Cost-optimized function configuration
const FUNCTION_CONFIG = {
    timeoutSeconds: 60,        // Max 60 seconds execution
    memory: "256MiB" as const, // Minimum memory needed
    maxInstances: 10,          // Limit concurrent instances
    minInstances: 0,           // No always-on instances (cost saving)
    retry: false,              // Don't retry on failure (prevent cost loops)
};

/**
 * Helper function to send push notification to a user
 */
async function sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data: Record<string, string>,
    clickAction: string = "/"
): Promise<void> {
    try {
        const userDoc = await admin.firestore().collection("users").doc(userId).get();
        const userData = userDoc.data();

        if (!userData?.fcmToken) {
            console.log(`No FCM token for user ${userId}`);
            return;
        }

        const message = {
            notification: {
                title,
                body,
            },
            data: {
                ...data,
                click_action: clickAction,
            },
            token: userData.fcmToken,
            android: {
                notification: {
                    sound: "default",
                    channelId: "ifilmdirectory_notifications",
                    priority: "high" as const,
                    defaultSound: true,
                    defaultVibrateTimings: true,
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                        badge: 1,
                        alert: {
                            title,
                            body,
                        },
                    },
                },
            },
            webpush: {
                notification: {
                    icon: "/logo.png",
                    badge: "/logo.png",
                    vibrate: [200, 100, 200],
                    requireInteraction: true,
                    silent: false,
                },
                fcmOptions: {
                    link: clickAction,
                },
            },
        };

        await admin.messaging().send(message);
        console.log(`Push notification sent to user ${userId}`);
    } catch (error) {
        console.error(`Failed to send push to user ${userId}:`, error);
    }
}

/**
 * Sends a push notification to admin when a new access request is submitted
 * Triggers on: New document created in 'access_requests' collection
 */
export const onnewaccessrequest = onDocumentCreated(
    { ...FUNCTION_CONFIG, document: "access_requests/{requestId}" },
    async (event) => {
        const requestData = event.data?.data();
        const requestId = event.params.requestId;

        if (!requestData) {
            console.log("No request data found");
            return;
        }

        try {
            // Get admin user(s)
            const adminsSnapshot = await admin
                .firestore()
                .collection("users")
                .where("role", "==", "admin")
                .get();

            if (adminsSnapshot.empty) {
                console.log("No admin users found to notify");
                return;
            }

            // Create notification for each admin
            const notificationPromises = adminsSnapshot.docs.map(async (adminDoc) => {
                const adminId = adminDoc.id;

                // Create in-app notification
                await admin.firestore().collection("notifications").add({
                    userId: adminId,
                    type: "system",
                    title: "🎬 New Access Request",
                    message: `${requestData.fullName} (${requestData.role}) has requested access`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    isRead: false,
                    actionLink: "/-admin",
                    metadata: {
                        requestId: requestId,
                        applicantName: requestData.fullName,
                        applicantEmail: requestData.email,
                        applicantRole: requestData.role,
                    },
                });

                // Send push notification
                await sendPushNotification(
                    adminId,
                    "🎬 New Access Request",
                    `${requestData.fullName} wants to join as ${requestData.role}`,
                    {
                        type: "access_request",
                        requestId: requestId,
                    },
                    "/-admin"
                );
            });

            await Promise.all(notificationPromises);
            console.log(`Notifications sent for request ${requestId}`);
        } catch (error) {
            console.error("Error sending notifications:", error);
        }
    });

/**
 * Send notification when someone likes a post
 * Triggers on: New document in 'posts/{postId}/likes' subcollection
 */
export const onpostlike = onDocumentCreated(
    { ...FUNCTION_CONFIG, document: "posts/{postId}/likes/{likeId}" },
    async (event) => {
        const likeData = event.data?.data();
        const postId = event.params.postId;

        if (!likeData) {
            console.log("No like data found");
            return;
        }

        const likerId = likeData.userId;

        try {
            // Get post data to find the post owner
            const postDoc = await admin.firestore().collection("posts").doc(postId).get();
            const postData = postDoc.data();

            if (!postData) {
                console.log("Post not found");
                return;
            }

            const postOwnerId = postData.userId;

            // Don't notify if user liked their own post
            if (postOwnerId === likerId) {
                return;
            }

            // Get liker's info
            const likerDoc = await admin.firestore().collection("users").doc(likerId).get();
            const likerData = likerDoc.data();

            if (!likerData) {
                console.log("Liker not found");
                return;
            }

            // Create in-app notification
            await admin.firestore().collection("notifications").add({
                userId: postOwnerId,
                type: "like",
                title: "❤️ New Like",
                message: `${likerData.displayName || likerData.username} liked your post`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isRead: false,
                image: likerData.photoURL,
                actionLink: `/post/${postId}`,
                metadata: {
                    postId: postId,
                    likerId: likerId,
                    likerName: likerData.displayName || likerData.username,
                },
            });

            // Send push notification
            await sendPushNotification(
                postOwnerId,
                "❤️ New Like",
                `${likerData.displayName || likerData.username} liked your post`,
                {
                    type: "like",
                    postId: postId,
                    likerId: likerId,
                },
                `/post/${postId}`
            );

            console.log(`Like notification sent for post ${postId}`);
        } catch (error) {
            console.error("Error sending like notification:", error);
        }
    });

/**
 * Send notification when someone comments on a post
 * Triggers on: New document in 'comments' collection
 */
export const onpostcomment = onDocumentCreated(
    { ...FUNCTION_CONFIG, document: "comments/{commentId}" },
    async (event) => {
        const commentData = event.data?.data();
        const commentId = event.params.commentId;

        if (!commentData) {
            console.log("No comment data found");
            return;
        }

        const commenterId = commentData.userId;
        const postId = commentData.postId;

        try {
            // Get post data to find the post owner
            const postDoc = await admin.firestore().collection("posts").doc(postId).get();
            const postData = postDoc.data();

            if (!postData) {
                console.log("Post not found");
                return;
            }

            const postOwnerId = postData.userId;

            // Don't notify if user commented on their own post
            if (postOwnerId === commenterId) {
                return;
            }

            // Get commenter's info
            const commenterDoc = await admin.firestore().collection("users").doc(commenterId).get();
            const commenterData = commenterDoc.data();

            if (!commenterData) {
                console.log("Commenter not found");
                return;
            }

            // Create in-app notification
            await admin.firestore().collection("notifications").add({
                userId: postOwnerId,
                type: "comment",
                title: "💬 New Comment",
                message: `${commenterData.displayName || commenterData.username} commented: "${commentData.text.substring(0, 50)}${commentData.text.length > 50 ? '...' : ''}"`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isRead: false,
                image: commenterData.photoURL,
                actionLink: `/post/${postId}`,
                metadata: {
                    postId: postId,
                    commentId: commentId,
                    commenterId: commenterId,
                    commenterName: commenterData.displayName || commenterData.username,
                },
            });

            // Send push notification
            await sendPushNotification(
                postOwnerId,
                "💬 New Comment",
                `${commenterData.displayName || commenterData.username} commented on your post`,
                {
                    type: "comment",
                    postId: postId,
                    commentId: commentId,
                    commenterId: commenterId,
                },
                `/post/${postId}`
            );

            console.log(`Comment notification sent for post ${postId}`);
        } catch (error) {
            console.error("Error sending comment notification:", error);
        }
    });

/**
 * Send notification when someone follows a user
 * Triggers on: New document in 'follows' collection
 */
export const onnewfollow = onDocumentCreated(
    { ...FUNCTION_CONFIG, document: "follows/{followId}" },
    async (event) => {
        const followData = event.data?.data();

        if (!followData) {
            console.log("No follow data found");
            return;
        }

        const followerId = followData.followerId;
        const followingId = followData.followingId;

        try {
            // Get follower's info
            const followerDoc = await admin.firestore().collection("users").doc(followerId).get();
            const followerData = followerDoc.data();

            if (!followerData) {
                console.log("Follower not found");
                return;
            }

            // Create in-app notification
            await admin.firestore().collection("notifications").add({
                userId: followingId,
                type: "follow",
                title: "👥 New Follower",
                message: `${followerData.displayName || followerData.username} started following you`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isRead: false,
                image: followerData.photoURL,
                actionLink: `/profile/${followerId}`,
                metadata: {
                    followerId: followerId,
                    followerName: followerData.displayName || followerData.username,
                },
            });

            // Send push notification
            await sendPushNotification(
                followingId,
                "👥 New Follower",
                `${followerData.displayName || followerData.username} started following you`,
                {
                    type: "follow",
                    followerId: followerId,
                },
                `/profile/${followerId}`
            );

            console.log(`Follow notification sent to user ${followingId}`);
        } catch (error) {
            console.error("Error sending follow notification:", error);
        }
    });

/**
 * Send notification for new messages (chats)
 * Triggers on: New document in 'chats/{chatId}/messages' subcollection
 */
export const onnewmessage = onDocumentCreated(
    { ...FUNCTION_CONFIG, document: "chats/{chatId}/messages/{messageId}" },
    async (event) => {
        const messageData = event.data?.data();
        const chatId = event.params.chatId;

        if (!messageData) {
            console.log("No message data found");
            return;
        }

        const senderId = messageData.senderId;

        try {
            // Get chat data to find participants
            const chatDoc = await admin.firestore().collection("chats").doc(chatId).get();
            const chatData = chatDoc.data();

            if (!chatData || !chatData.participants) {
                console.log("Chat not found or no participants");
                return;
            }

            // Get sender's info
            const senderDoc = await admin.firestore().collection("users").doc(senderId).get();
            const senderData = senderDoc.data();

            if (!senderData) {
                console.log("Sender not found");
                return;
            }

            // Notify all participants except the sender
            const recipientIds = chatData.participants.filter((id: string) => id !== senderId);

            const notificationPromises = recipientIds.map(async (recipientId: string) => {
                // Create in-app notification
                await admin.firestore().collection("notifications").add({
                    userId: recipientId,
                    type: "message",
                    title: "💬 New Message",
                    message: `${senderData.displayName || senderData.username}: ${messageData.text.substring(0, 50)}${messageData.text.length > 50 ? '...' : ''}`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    isRead: false,
                    image: senderData.photoURL,
                    actionLink: `/messages/${chatId}`,
                    metadata: {
                        chatId: chatId,
                        senderId: senderId,
                        senderName: senderData.displayName || senderData.username,
                    },
                });

                // Send push notification
                await sendPushNotification(
                    recipientId,
                    `💬 ${senderData.displayName || senderData.username}`,
                    messageData.text.substring(0, 100),
                    {
                        type: "message",
                        chatId: chatId,
                        senderId: senderId,
                    },
                    `/messages/${chatId}`
                );
            });

            await Promise.all(notificationPromises);
            console.log(`Message notifications sent for chat ${chatId}`);
        } catch (error) {
            console.error("Error sending message notification:", error);
        }
    });

/**
 * Send notification for connection requests
 * Triggers on: New document in 'connection_requests' collection
 */
export const onconnectionrequest = onDocumentCreated(
    { ...FUNCTION_CONFIG, document: "connection_requests/{requestId}" },
    async (event) => {
        const requestData = event.data?.data();

        if (!requestData) {
            console.log("No request data found");
            return;
        }

        const requesterId = requestData.requesterId;
        const recipientId = requestData.recipientId;

        try {
            // Get requester's info
            const requesterDoc = await admin.firestore().collection("users").doc(requesterId).get();
            const requesterData = requesterDoc.data();

            if (!requesterData) {
                console.log("Requester not found");
                return;
            }

            // Create in-app notification
            await admin.firestore().collection("notifications").add({
                userId: recipientId,
                type: "connection",
                title: "🤝 Connection Request",
                message: `${requesterData.displayName || requesterData.username} wants to connect with you`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isRead: false,
                image: requesterData.photoURL,
                actionLink: `/profile/${requesterId}`,
                metadata: {
                    requesterId: requesterId,
                    requesterName: requesterData.displayName || requesterData.username,
                },
            });

            // Send push notification
            await sendPushNotification(
                recipientId,
                "🤝 Connection Request",
                `${requesterData.displayName || requesterData.username} wants to connect with you`,
                {
                    type: "connection",
                    requesterId: requesterId,
                },
                `/profile/${requesterId}`
            );

            console.log(`Connection request notification sent to user ${recipientId}`);
        } catch (error) {
            console.error("Error sending connection request notification:", error);
        }
    });
