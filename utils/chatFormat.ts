import type { Message } from '@/types/chat';

export function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function groupMessages(messages: Message[]): Array<{ date: string; messages: Message[] }> {
  const map: Record<string, Message[]> = {};
  messages.forEach(m => {
    const key = new Date(m.createdAt).toDateString();
    map[key] = map[key] || [];
    map[key].push(m);
  });
  return Object.entries(map).map(([date, msgs]) => ({ date, messages: msgs }));
}

export function directConversationId(a: string, b: string) {
  return [a, b].sort().join('_');
}