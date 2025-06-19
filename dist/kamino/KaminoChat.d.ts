import { Component } from 'solid-js';
export interface BotResponse {
    text: string;
    mediaUrl?: string;
}
export type SendMessageFn = (message: string) => Promise<BotResponse>;
interface KaminoChatProps {
    sendMessageToBackend: SendMessageFn;
}
export declare const KaminoChat: Component<KaminoChatProps>;
export default KaminoChat;
//# sourceMappingURL=KaminoChat.d.ts.map
