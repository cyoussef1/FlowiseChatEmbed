import { registerWebComponents } from './register';
import { parseChatbot, injectChatbotInWindow } from './window';
export { KaminoChat } from './kamino';

registerWebComponents();

const chatbot = parseChatbot();

injectChatbotInWindow(chatbot);

export default chatbot;
