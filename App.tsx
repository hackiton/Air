import React, { useState, useRef, useEffect } from 'react';
import { generateResponse, fileToGenerativePart } from './services/geminiService';
import { Message, Role, AppSettings } from './types';
import { IconSparkles, IconBrain, IconGlobe, IconSend, IconPlus, IconImage, IconWhatsApp, IconDownload, IconCopy, IconCheck } from './components/Icons';
import { MarkdownRenderer } from './components/MarkdownRenderer';

// --- Components ---

const Header = () => (
  <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center px-6 fixed top-0 w-full z-20">
    <div className="flex items-center gap-2 text-primary-400">
      <div className="p-1.5 bg-primary-500/10 rounded-lg border border-primary-500/20">
        <IconSparkles className="w-5 h-5" />
      </div>
      <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-neon-blue">
        NEXUS
      </span>
      <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900 ml-2">v2.5</span>
    </div>
  </header>
);

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const [isCopied, setIsCopied] = useState(false);

  const handleWhatsAppShare = async () => {
    // Mobile/Native Share API (supports images)
    if (navigator.share) {
      try {
        const shareData: any = {
          text: message.text || "Check out this AI generation from Nexus!",
        };
        
        // If there are images, try to share the first one
        if (message.images && message.images.length > 0) {
          // Convert base64 to blob
          const byteCharacters = atob(message.images[0]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });
          const file = new File([blob], 'generated-image.png', { type: 'image/png' });
          shareData.files = [file];
        }

        if (navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
        }
      } catch (err) {
        console.log('Native share failed or dismissed, falling back to URL');
      }
    }

    // Fallback: Text only via URL scheme
    const textToShare = message.text ? message.text : "Check out this image I generated with Nexus!";
    const url = `https://wa.me/?text=${encodeURIComponent(textToShare)}`;
    window.open(url, '_blank');
  };

  const handleCopy = async () => {
    try {
        if (message.images && message.images.length > 0) {
            // Copy Image to Clipboard (great for WhatsApp Web)
            const byteCharacters = atob(message.images[0]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);
        } else {
            // Copy Text
            await navigator.clipboard.writeText(message.text);
        }
        
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy', err);
    }
  };

  const downloadImage = (base64Data: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Data}`;
    link.download = `nexus-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 animate-fade-in`}>
      <div className={`max-w-[90%] lg:max-w-[75%] flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-indigo-600' : 'bg-slate-700'}`}>
          {isUser ? <span className="text-xs font-bold text-white">U</span> : <IconSparkles className="w-4 h-4 text-neon-blue" />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}>
          <div className={`rounded-2xl px-6 py-4 border relative group/bubble ${
            isUser 
              ? 'bg-indigo-600 border-indigo-500 text-white' 
              : 'bg-slate-800/50 border-slate-700/50 backdrop-blur-sm text-slate-200 shadow-xl'
          }`}>
            
            {/* Thinking Indicator for AI */}
            {!isUser && message.isThinking && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
                 <IconBrain className="w-4 h-4 text-pink-400 animate-pulse" />
                 <span className="text-xs font-mono text-pink-400">DEEP REASONING ENGINE ACTIVE...</span>
              </div>
            )}

            {/* Attached Images */}
            {message.images && message.images.length > 0 && (
              <div className={`flex gap-2 mb-3 overflow-x-auto ${isUser ? 'justify-end' : 'justify-start'}`}>
                {message.images.map((img, idx) => (
                  <div key={idx} className="relative group/image flex-shrink-0">
                    <img src={`data:image/png;base64,${img}`} alt="Attached" className="h-48 w-auto rounded-lg border border-white/10" />
                    {!isUser && (
                        <div className="absolute top-2 right-2 flex gap-1">
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(img);
                                }}
                                className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm"
                                title="Download Image"
                            >
                                <IconDownload className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Text Body */}
            {message.text && (
              <div className="prose prose-invert prose-sm max-w-none">
                <MarkdownRenderer content={message.text} />
              </div>
            )}

            {/* Grounding Sources */}
            {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                <span className="text-xs text-slate-400 w-full mb-1 flex items-center gap-1">
                   <IconGlobe className="w-3 h-3" /> Sources verified:
                </span>
                {message.groundingSources.map((source, idx) => (
                   <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2 py-1 rounded transition-colors truncate max-w-[200px]"
                   >
                     {source.title}
                   </a>
                ))}
              </div>
            )}
          </div>
          
          {/* AI Message Action Bar */}
          {!isUser && (
              <div className="flex gap-4 mt-2 ml-1 items-center">
                  <span className="text-xs text-slate-600 font-mono">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  <div className="h-3 w-px bg-slate-800" />

                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    {isCopied ? <IconCheck className="w-3.5 h-3.5 text-emerald-400" /> : <IconCopy className="w-3.5 h-3.5" />}
                    {isCopied ? "Copied" : (message.images && message.images.length > 0 ? "Copy Image" : "Copy")}
                  </button>

                  <div className="h-3 w-px bg-slate-800" />

                  <button
                    onClick={handleWhatsAppShare}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#25D366] transition-colors"
                  >
                    <IconWhatsApp className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
              </div>
          )}

          {isUser && (
            <span className="text-xs text-slate-600 mt-2 font-mono">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; icon: React.ReactNode; colorClass: string }> = ({ checked, onChange, label, icon, colorClass }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${
      checked 
        ? `bg-slate-800 ${colorClass} border-transparent shadow-[0_0_15px_rgba(0,0,0,0.3)]` 
        : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-600'
    }`}
  >
    <div className={`${checked ? 'opacity-100' : 'opacity-50'}`}>
        {icon}
    </div>
    <span className={`text-xs font-medium ${checked ? 'text-white' : ''}`}>{label}</span>
    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${checked ? 'bg-slate-700' : 'bg-slate-800'}`}>
        <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  </button>
);

// --- Main Application ---

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
        id: 'welcome',
        role: Role.MODEL,
        text: "Hi! I am Garuda. Your AI agent created by Hackiton.",
        timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    useDeepThinking: false,
    useWebGrounding: false,
    generateImage: false,
    thinkingBudget: 2048
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if ((!input.trim() && selectedImages.length === 0) || isTyping) return;

    const userText = input;
    const currentImages = [...selectedImages];
    
    // Clear inputs
    setInput('');
    setSelectedImages([]);

    // Convert images to base64 for display in UI immediately
    const base64Images: string[] = [];
    for(const img of currentImages) {
       const res = await fileToGenerativePart(img);
       base64Images.push(res.inlineData.data);
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now(),
      images: base64Images
    };

    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }] 
      }));

      const result = await generateResponse(userText, currentImages, history, settings);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: result.text,
        timestamp: Date.now(),
        isThinking: settings.useDeepThinking && !settings.generateImage,
        groundingSources: result.groundingSources,
        images: result.generatedImages
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: `**Error:** ${error.message || "Something went wrong."}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setSelectedImages(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <Header />

      {/* Main Chat Area */}
      <main className="pt-20 pb-40 max-w-4xl mx-auto px-4 sm:px-6 min-h-screen flex flex-col">
        <div className="flex-1">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {isTyping && (
            <div className="flex w-full justify-start mb-8 animate-pulse">
                <div className="flex items-center gap-3 bg-slate-800/30 px-4 py-3 rounded-2xl border border-white/5">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '0ms'}} />
                   <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{animationDelay: '150ms'}} />
                   <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{animationDelay: '300ms'}} />
                   <span className="text-xs text-slate-500 font-mono ml-2">
                      {settings.generateImage ? "CREATING IMAGE..." : (settings.useDeepThinking ? "REASONING..." : "GENERATING...")}
                   </span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area - Sticky Bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pb-6 pt-10 z-10 px-4">
        <div className="max-w-3xl mx-auto">
          
          {/* Controls */}
          <div className="flex justify-center flex-wrap gap-4 mb-3">
             <Toggle 
               label="Deep Reasoner" 
               checked={settings.useDeepThinking} 
               onChange={(v) => setSettings(prev => ({ ...prev, useDeepThinking: v, generateImage: v ? false : prev.generateImage }))} 
               icon={<IconBrain className="w-3.5 h-3.5" />}
               colorClass="text-pink-400 border-pink-500/50"
             />
             <Toggle 
               label="Web Grounding" 
               checked={settings.useWebGrounding} 
               onChange={(v) => setSettings(prev => ({ ...prev, useWebGrounding: v, generateImage: v ? false : prev.generateImage }))} 
               icon={<IconGlobe className="w-3.5 h-3.5" />}
               colorClass="text-emerald-400 border-emerald-500/50"
             />
             <Toggle 
               label="Image Gen" 
               checked={settings.generateImage} 
               onChange={(v) => setSettings(prev => ({ ...prev, generateImage: v, useDeepThinking: v ? false : prev.useDeepThinking, useWebGrounding: v ? false : prev.useWebGrounding }))} 
               icon={<IconImage className="w-3.5 h-3.5" />}
               colorClass="text-yellow-400 border-yellow-500/50"
             />
          </div>

          {/* Image Previews */}
          {selectedImages.length > 0 && (
             <div className="flex gap-2 mb-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800 mx-2 backdrop-blur w-fit">
                {selectedImages.map((file, i) => (
                    <div key={i} className="relative group">
                        <img src={URL.createObjectURL(file)} className="w-12 h-12 rounded object-cover border border-slate-600" alt="preview" />
                        <button 
                          onClick={() => setSelectedImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            ×
                        </button>
                    </div>
                ))}
             </div>
          )}

          {/* Text Input */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-30 group-hover:opacity-60 transition duration-500 blur"></div>
            <div className="relative flex items-end gap-2 bg-slate-900 rounded-2xl p-2 border border-slate-800 shadow-2xl">
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Upload Image"
              >
                <IconImage className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept="image/*"
                onChange={handleFileSelect}
              />

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={settings.generateImage ? "Describe the image you want to create..." : "Ask complex questions..."}
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm p-3 focus:outline-none resize-none max-h-32 min-h-[44px]"
                rows={1}
                style={{ height: 'auto', minHeight: '44px' }}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
                }}
              />

              <button
                onClick={handleSend}
                disabled={(!input.trim() && selectedImages.length === 0) || isTyping}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  (input.trim() || selectedImages.length > 0) && !isTyping
                    ? 'bg-indigo-600 text-white shadow-lg hover:shadow-indigo-500/25 hover:scale-105' 
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <IconSend className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="text-center mt-2 text-[10px] text-slate-600 font-mono">
            Powered by {settings.generateImage ? "Gemini 2.5 Flash Image" : "Gemini 2.5 Flash"} • {settings.useDeepThinking ? "Thinking Mode: ON" : (settings.generateImage ? "Image Mode: ON" : "Standard Mode")}
          </div>
        </div>
      </div>
    </div>
  );
}