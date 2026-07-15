"use client";

import { FormEvent, useState } from "react";

type Citation = { title: string; url: string };
type Message = { role: "assistant" | "user"; text: string; citations?: Citation[] };

export default function StudyAssistant() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "What would you like to understand? I’ll search your notes first." }]);
  const [question, setQuestion] = useState("");
  const [allowWeb, setAllowWeb] = useState(true);
  const [loading, setLoading] = useState(false);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt || loading) return;
    setMessages((current) => [...current, { role: "user", text: prompt }]);
    setQuestion("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: prompt, allowWeb }) });
      const data: { answer?: string; citations?: Citation[]; error?: string } = await response.json();
      if (!response.ok || !data.answer) throw new Error(data.error || "The assistant is unavailable.");
      setMessages((current) => [...current, { role: "assistant", text: data.answer!, citations: data.citations }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error instanceof Error ? error.message : "Something went wrong." }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => <div className={`message ${message.role}`} key={index}><span>{message.role === "user" ? "You" : "OpenNotes AI"}</span><p>{message.text}</p>{message.citations?.length ? <div className="citations"><strong>Online sources</strong>{message.citations.map((citation) => <a href={citation.url} target="_blank" rel="noreferrer" key={citation.url}>{citation.title || citation.url}</a>)}</div> : null}</div>)}
        {loading ? <div className="message assistant"><span>OpenNotes AI</span><p>Searching your notes…</p></div> : null}
      </div>
      <form className="chat-form" onSubmit={ask}>
        <label className="sr-only" htmlFor="question">Ask a question</label>
        <textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000} placeholder="Ask about a lecture, concept, or assignment…" rows={2} required />
        <div><label><input type="checkbox" checked={allowWeb} onChange={(event) => setAllowWeb(event.target.checked)} /> Include online sources</label><button disabled={loading} type="submit">Ask ↑</button></div>
      </form>
    </div>
  );
}
