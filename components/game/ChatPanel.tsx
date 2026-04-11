"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { subscribeChat, sendChatMessage } from "@/lib/firestore";
import { avatarColor } from "@/lib/utils";
import type { DocumentData } from "firebase/firestore";

const QUICK_EMOJIS = ["👍", "🔍", "❓", "💡", "🎉", "🤔"];

interface ChatPanelProps {
  sessionId: string;
  uid: string;
  userName: string;
}

export function ChatPanel({ sessionId, uid, userName }: ChatPanelProps) {
  const [messages, setMessages] = useState<DocumentData[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const memberColors = useRef<Record<string, string>>({});
  let colorIndex = 0;

  const getColor = (memberId: string) => {
    if (!memberColors.current[memberId]) {
      memberColors.current[memberId] = avatarColor(colorIndex++);
    }
    return memberColors.current[memberId];
  };

  useEffect(() => {
    const unsub = subscribeChat(sessionId, setMessages);
    return () => unsub();
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (content: string) => {
    if (!content.trim()) return;
    await sendChatMessage(sessionId, uid, userName, content.trim());
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0" style={{ maxHeight: "calc(100vh - 240px)" }}>
        {messages.length === 0 ? (
          <p className="text-center text-sm py-8" style={{ color: "var(--text-faint)" }}>
            Még nincs üzenet. Kezdjetek el kommunikálni!
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.uid === uid;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: getColor(msg.uid), color: "#000" }}
                >
                  {(msg.name || "?")[0].toUpperCase()}
                </div>
                <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  {!isMe && (
                    <span className="text-[10px] px-1" style={{ color: "var(--text-faint)" }}>{msg.name}</span>
                  )}
                  <div
                    className="px-3 py-2 rounded-2xl text-sm"
                    style={{
                      background: isMe ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${isMe ? "var(--border-glow)" : "var(--border-dim)"}`,
                      color: "var(--text-primary)",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick emojis */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto" style={{ borderTop: "1px solid var(--border-dim)" }}>
        {QUICK_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => send(e)}
            className="text-xl w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 px-4 pb-safe py-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(text)}
          placeholder="Üzenet…"
          className="input-seekr flex-1"
          style={{ minHeight: "44px" }}
        />
        <button
          onClick={() => send(text)}
          disabled={!text.trim()}
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{
            background: text.trim() ? "var(--cyan)" : "rgba(255,255,255,0.05)",
            color: text.trim() ? "#000" : "var(--text-faint)",
          }}
          aria-label="Küldés"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
