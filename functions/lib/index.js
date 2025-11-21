import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
admin.initializeApp();
const db = admin.firestore();
export const onMessageCreate = functions.firestore
    .document('conversations/{conversationId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
    const message = snap.data();
    const conversationId = context.params.conversationId;
    const convoRef = db.collection('conversations').doc(conversationId);
    const convoSnap = await convoRef.get();
    if (!convoSnap.exists)
        return;
    const convoData = convoSnap.data();
    // Update lastMessage + updatedAt
    await convoRef.update({
        lastMessage: {
            text: message.text,
            senderId: message.senderId,
            createdAt: message.createdAt,
            type: message.type,
        },
        updatedAt: Date.now(),
    });
    // Increment unread counts
    const members = convoData.members;
    const updatedMembers = members.map(m => {
        if (m.uid === message.senderId)
            return m; // sender doesn't get unread increment
        const unread = (m.unreadCount || 0) + 1;
        return { ...m, unreadCount: unread };
    });
    await convoRef.update({ members: updatedMembers });
    // Fetch Expo push tokens stored at users/{uid}.fcmTokens
    const expoTokens = [];
    for (const m of members) {
        if (m.uid === message.senderId)
            continue;
        const userSnap = await db.collection('users').doc(m.uid).get();
        if (userSnap.exists) {
            const data = userSnap.data();
            if (Array.isArray(data.fcmTokens)) {
                data.fcmTokens.forEach((t) => {
                    if (typeof t === 'string' && t.startsWith('ExponentPushToken'))
                        expoTokens.push(t);
                });
            }
        }
    }
    if (expoTokens.length === 0)
        return;
    const body = message.type === 'image' ? 'Image envoyée' : message.text || 'Nouveau message';
    // Prepare Expo push messages (chunk max 100 per request if needed)
    const chunks = [];
    for (let i = 0; i < expoTokens.length; i += 100) {
        chunks.push(expoTokens.slice(i, i + 100));
    }
    const results = [];
    for (const chunk of chunks) {
        const messages = chunk.map(token => ({
            to: token,
            title: convoData.title || 'Nouveau message',
            body,
            data: { conversationId, senderId: message.senderId, type: message.type },
            sound: 'default'
        }));
        try {
            const res = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messages)
            });
            const json = await res.json();
            results.push(json);
        }
        catch (err) {
            console.error('Expo push error', err);
        }
    }
    console.log('Expo push results', JSON.stringify(results));
});
export const onUserStatusUpdate = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
    const after = change.after.data();
    if (after?.lastActiveAt) {
        console.log(`User ${context.params.userId} active at ${after.lastActiveAt}`);
    }
});
// When a validation is approved, credit points to the original author
export const onValidationApproved = functions.firestore
    .document('validations/{validationId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after)
        return;
    if (before.status !== 'approved' && after.status === 'approved') {
        const uid = after.userId;
        const points = Number(after.points || 0);
        if (!uid || !points)
            return;
        await db.collection('users').doc(uid).set({ points: admin.firestore.FieldValue.increment(points) }, { merge: true });
        console.log(`Credited ${points} points to user ${uid} for validation ${context.params.validationId}`);
    }
});
