import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();
const db = admin.firestore();


interface ConversationMember { uid: string; role: string; joinedAt: number; lastReadAt?: number; unreadCount?: number; }

export const onMessageCreate = functions.firestore
  .document('conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snap: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
    const message: any = snap.data();
    const conversationId: string = context.params.conversationId as string;
    const convoRef = db.collection('conversations').doc(conversationId);
    const convoSnap = await convoRef.get();
    if (!convoSnap.exists) return;
    const convoData = convoSnap.data()!;

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
    const members: ConversationMember[] = convoData.members;
    const updatedMembers = members.map(m => {
      if (m.uid === message.senderId) return m; // sender doesn't get unread increment
      const unread = (m.unreadCount || 0) + 1;
      return { ...m, unreadCount: unread };
    });
    await convoRef.update({ members: updatedMembers });

    // Fetch Expo push tokens stored at users/{uid}.fcmTokens
    const expoTokens: string[] = [];
    for (const m of members) {
      if (m.uid === message.senderId) continue;
      const userSnap = await db.collection('users').doc(m.uid).get();
      if (userSnap.exists) {
        const data = userSnap.data() as any;
        if (Array.isArray(data.fcmTokens)) {
          data.fcmTokens.forEach((t: string) => {
            if (typeof t === 'string' && t.startsWith('ExponentPushToken')) expoTokens.push(t);
          });
        }
      }
    }
    if (expoTokens.length === 0) return;

    const body = message.type === 'image' ? 'Image envoyée' : message.text || 'Nouveau message';
    // Prepare Expo push messages (chunk max 100 per request if needed)
    const chunks: string[][] = [];
    for (let i = 0; i < expoTokens.length; i += 100) {
      chunks.push(expoTokens.slice(i, i + 100));
    }
    const results: any[] = [];
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
      } catch (err) {
        console.error('Expo push error', err);
      }
    }
    console.log('Expo push results', JSON.stringify(results));
  });

export const onUserStatusUpdate = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    const after: any = change.after.data();
    if (after?.lastActiveAt) {
      console.log(`User ${context.params.userId} active at ${after.lastActiveAt}`);
    }
  });