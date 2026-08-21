import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Trash2,
  BookOpen,
  ArrowRight,
  Bot,
  User,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

export default function ChatWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi there! 👋 I am your **AI Library Assistant**. Ask me anything about book recommendations, library rules, overdue policies, or topics you want to explore!',
      suggested_books: [],
      quick_replies: [
        'Suggest Machine Learning books',
        'What are the library rules & timings?',
        'How does AI recommendation work?',
        'Find books on Algorithms'
      ]
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: query,
        history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content }))
      });

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.reply,
        suggested_books: res.data.suggested_books || [],
        quick_replies: res.data.quick_replies || []
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an issue reaching the library AI service. Please try again in a moment.',
          suggested_books: [],
          quick_replies: ['Try again', 'Show books']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Chat history cleared. How can I help you find books or navigate the library today?',
        suggested_books: [],
        quick_replies: [
          'Recommend Python books',
          'What is the borrowing limit?',
          'Find Data Science books'
        ]
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chatbox Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] max-h-[80vh] rounded-3xl glass-panel border border-brand-500/30 bg-slate-950/95 backdrop-blur-2xl shadow-2xl shadow-brand-500/20 flex flex-col overflow-hidden mb-3 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-500 to-ai-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  AI Library Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[11px] text-slate-400">Powered by NLP & Hybrid ML</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear conversation"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((m) => {
              const isAi = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
                >
                  {isAi && (
                    <div className="w-7 h-7 rounded-xl bg-ai-500/20 text-ai-400 border border-ai-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-2.5 max-w-[82%]`}>
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                        isAi
                          ? 'bg-slate-900 border border-slate-800/80 text-slate-200 shadow-md'
                          : 'bg-brand-600 text-white shadow-lg shadow-brand-600/20 rounded-tr-none'
                      }`}
                    >
                      {m.content}
                    </div>

                    {/* Embedded Suggested Books Cards */}
                    {isAi && m.suggested_books && m.suggested_books.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Recommended Books:
                        </p>
                        <div className="space-y-1.5">
                          {m.suggested_books.map((b) => (
                            <div
                              key={b.id}
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/student/books/${b.id}`);
                              }}
                              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-brand-500/40 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={
                                    b.cover_image ||
                                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'
                                  }
                                  alt={b.title}
                                  className="w-7 h-10 object-cover rounded shadow-sm shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-bold text-white group-hover:text-brand-300 truncate text-[11px]">
                                    {b.title}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    by {b.author_name} • <span className="text-ai-300">{b.category_name}</span>
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] text-brand-400 flex items-center gap-0.5 shrink-0">
                                View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Reply Chips */}
                    {isAi && m.quick_replies && m.quick_replies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.quick_replies.map((chip, idx) => (
                          <button
                            key={idx}
                            onClick={() => sendMessage(chip)}
                            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-brand-600/30 hover:border-brand-500/40 text-slate-300 hover:text-brand-200 border border-slate-800 text-[10px] font-medium transition-all text-left"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-xl bg-ai-500/20 text-ai-400 border border-ai-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[11px]">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800">
            <div className="flex items-center gap-2 bg-slate-950 rounded-2xl border border-slate-800 px-3 py-2 focus-within:border-brand-500 transition-colors">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about books, rules, topics..."
                disabled={loading}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="p-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:hover:bg-brand-600 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-ai-600 hover:from-brand-500 hover:to-ai-500 text-white shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-105 active:scale-95 transition-all border border-brand-400/30"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
        </div>
        <span className="font-display font-bold text-xs tracking-wide">
          {isOpen ? 'Close Assistant' : 'AI Library Chatbox'}
        </span>
      </button>
    </div>
  );
}
