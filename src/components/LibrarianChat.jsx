import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookUser, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';

const LibrarianChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Call real AI backend
    try {
      const { data, error } = await supabase.functions.invoke('librarian-chat', {
        body: { message: input }
      });

      if (error) throw error;

      const aiMessage = { sender: 'ai', text: data.response || 'I apologize, but I encountered an error. Please try again.' };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Librarian AI error:', error);
      const errorMessage = {
        sender: 'ai',
        text: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-24 right-5 w-full max-w-sm h-[60vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50"
          >
            <header className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <BookUser className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Librarian AI</h3>
                  <p className="text-xs text-green-600 font-semibold">Online</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </header>
            <main className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-800 p-3 rounded-lg max-w-xs">
                    <p className="text-sm">Hello! I'm the Librarian Agent, your AI co-pilot. I'm trained on our entire course and all tax deed laws. How can I help you today?</p>
                  </div>
                </div>
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-800 p-3 rounded-lg max-w-xs">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </main>
            <footer className="p-4 border-t border-slate-200">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about tax deeds..."
                  autoComplete="off"
                />
                <Button type="submit" disabled={isLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-5 right-5 z-50"
      >
        <Button
          size="icon"
          className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-8 h-8" /> : <BookUser className="w-8 h-8" />}
        </Button>
      </motion.div>
    </>
  );
};

export default LibrarianChat;
