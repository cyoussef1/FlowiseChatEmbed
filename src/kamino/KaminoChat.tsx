import { Component, createSignal, For, Show, onCleanup, createEffect } from 'solid-js';
import styles from './KaminoChat.css';

export interface BotResponse {
  text: string;
  mediaUrl?: string;
}

export type SendMessageFn = (message: string) => Promise<BotResponse>;

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  mediaUrl?: string;
}

interface KaminoChatProps {
  sendMessageToBackend: SendMessageFn;
}

const defaultSendMessage: SendMessageFn = async (message: string) => {
  const response = await fetch(
    'https://console.venar.tech:3001/api/v1/prediction/4b567ab9-08ec-4e6b-9e56-44d0d92ce6df',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: message }),
    },
  );
  const data = await response.json();
  return {
    text: data.text || data.answer || '',
    mediaUrl: data.mediaUrl,
  };
};

export const KaminoChat: Component<KaminoChatProps> = (props) => {
  const sendMessage = props.sendMessageToBackend || defaultSendMessage;
  const [open, setOpen] = createSignal(false);
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [input, setInput] = createSignal('');
  const [typing, setTyping] = createSignal(false);
  const [unread, setUnread] = createSignal(0);
  const [showScroll, setShowScroll] = createSignal(false);
  const [position, setPosition] = createSignal({ x: window.innerWidth - 410, y: window.innerHeight - 580 });

  let messagesRef: HTMLDivElement | undefined;
  let containerRef: HTMLDivElement | undefined;

  const toggleOpen = () => {
    setOpen((o) => !o);
    if (!open()) {
      setUnread(0);
    }
  };

  const addMessage = (msg: Message) => {
    setMessages((m) => [...m, msg]);
  };

  const handleSend = async () => {
    const text = input().trim();
    if (!text) return;
    addMessage({ id: Date.now(), sender: 'user', text });
    setInput('');
    setTyping(true);
    try {
      const res = await sendMessage(text);
      addMessage({ id: Date.now() + 1, sender: 'bot', text: res.text, mediaUrl: res.mediaUrl });
    } finally {
      setTyping(false);
      if (!open()) setUnread((u) => u + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const scrollToBottom = () => {
    if (messagesRef) {
      messagesRef.scrollTop = messagesRef.scrollHeight;
    }
  };

  createEffect(() => {
    if (open()) {
      scrollToBottom();
    }
  });

  const onScroll = () => {
    if (messagesRef) {
      const diff = messagesRef.scrollHeight - messagesRef.scrollTop - messagesRef.clientHeight;
      setShowScroll(diff > 50);
    }
  };

  let dragStartX = 0;
  let dragStartY = 0;

  const onPointerDown = (e: PointerEvent) => {
    dragStartX = e.clientX - position().x;
    dragStartY = e.clientY - position().y;
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMove = (e: PointerEvent) => {
    setPosition({ x: e.clientX - dragStartX, y: e.clientY - dragStartY });
  };

  const onPointerUp = () => {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  };

  onCleanup(() => onPointerUp());

  return (
    <>
      <style>{styles}</style>
      <Show when={open()}>
        <div
          class="kamino-container"
          style={{ left: `${position().x}px`, top: `${position().y}px` }}
          ref={containerRef}
        >
          <div class="kamino-header" onPointerDown={onPointerDown}>
            <div class="kamino-header-title">
              <div class="kamino-avatar">M</div>
              <span>Kamino Chat</span>
            </div>
            <button class="kamino-close" onClick={toggleOpen}>×</button>
          </div>
          <div class="kamino-welcome">
            <p>Welkom bij Kamino-chat!<br />
            Ik ben je digitale padgenoot: een veilige plek om vrijuit te praten over geloof, welzijn, studie of gewoon wat er op je hart ligt.<br />
            We bewaren je berichten maximaal 1 jaar om jouw veiligheid te waarborgen – meer weten? zie <a href="https://kamino.be/privacy" target="_blank" rel="noopener noreferrer">kamino.be/privacy</a>.<br />
            Waarmee kan ik je vandaag helpen?</p>
          </div>
          <div class="kamino-messages" ref={messagesRef} onScroll={onScroll}>
            <For each={messages()}>{(msg) => (
              <div class={"kamino-message " + msg.sender}>
                <div class="kamino-avatar-small">{msg.sender === 'bot' ? 'M' : 'Jij'}</div>
                <div class="kamino-bubble">
                  {msg.text}
                  <Show when={msg.mediaUrl}>
                    <img src={msg.mediaUrl!} alt="media" class="kamino-media" />
                  </Show>
                </div>
              </div>
            )}</For>
            <Show when={typing()}>
              <div class="kamino-message bot">
                <div class="kamino-avatar-small">M</div>
                <div class="kamino-bubble typing">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
              </div>
            </Show>
          </div>
          <Show when={showScroll()}>
            <button class="kamino-scroll" onClick={scrollToBottom}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 16l-6-6h12z" fill="currentColor" />
              </svg>
            </button>
          </Show>
          <div class="kamino-input">
            <textarea
              placeholder="Typ je vraag…"
              value={input()}
              onInput={(e) => setInput(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSend} aria-label="Send">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </Show>
      <button class="kamino-open" onClick={toggleOpen} style={{ display: open() ? 'none' : 'flex' }}>
        <svg viewBox="0 0 24 24" width="28" height="28">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            fill="currentColor"
          />
        </svg>
        <Show when={unread() > 0}>
          <span class="kamino-badge">{unread()}</span>
        </Show>
      </button>
    </>
  );
};

export default KaminoChat;
