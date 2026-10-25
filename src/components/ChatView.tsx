import React, { useState, useRef, useEffect } from 'react';
import { Character, ChatMessage } from '../types/character';
import { useSpeech } from '../hooks/useSpeech';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import {
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCw,
  Copy,
  Check,
  Sparkles,
  Info,
  Trash2,
  Image as ImageIcon,
  Download,
  Maximize2,
  X,
  AlertCircle,
  CheckCheck,
} from 'lucide-react';

interface ChatViewProps {
  character: Character;
  onBack: () => void;
  onOpenImageModal: () => void;
  onOpenProfileModal: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  character,
  onBack,
  onOpenImageModal,
  onOpenProfileModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    storageService.getChatHistory(character)
  );
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; prompt?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Speech integration hook
  const {
    isSpeaking,
    speakingMessageId,
    speak,
    stopSpeaking,
    isListening,
    startListening,
    stopListening,
    speechError,
    clearSpeechError,
  } = useSpeech();

  // Scroll to bottom on new message or typing state change
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping]);

  // Persist messages whenever updated
  const updateMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    storageService.saveChatHistory(character.id, newMessages);
  };

  // Format timestamp (e.g. 10:45 AM)
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Send a user message
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    setErrorMessage(null);
    setInputValue('');

    const userMessage: ChatMessage = {
      id: 'msg-user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      type: 'text',
    };

    const newHistory = [...messages, userMessage];
    updateMessages(newHistory);
    setIsTyping(true);

    try {
      const replyText = await geminiService.sendMessage({
        character,
        history: newHistory,
        message: text,
      });

      const characterReply: ChatMessage = {
        id: 'msg-model-' + Date.now(),
        role: 'model',
        content: replyText,
        timestamp: Date.now(),
        type: 'text',
      };

      updateMessages([...newHistory, characterReply]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Failed to get a response from character.');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  // Regenerate last reply
  const handleRegenerate = async (messageIndex: number) => {
    if (isTyping) return;

    // Find the context up to the previous user message
    const previousHistory = messages.slice(0, messageIndex);
    // Find the last user message before this
    const lastUserMsg = [...previousHistory].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    setIsTyping(true);
    setErrorMessage(null);

    try {
      const newReplyText = await geminiService.sendMessage({
        character,
        history: previousHistory,
        message: lastUserMsg.content,
      });

      const updated = [...messages];
      updated[messageIndex] = {
        ...updated[messageIndex],
        content: newReplyText,
        timestamp: Date.now(),
      };

      updateMessages(updated);
    } catch (err: any) {
      console.error('Regenerate error:', err);
      setErrorMessage(err.message || 'Failed to regenerate reply.');
    } finally {
      setIsTyping(false);
    }
  };

  // Clear chat
  const handleClearChat = () => {
    if (confirm(`Clear all chat history with ${character.name}?`)) {
      stopSpeaking();
      const freshHistory = storageService.clearChatHistory(character);
      setMessages(freshHistory);
      setErrorMessage(null);
    }
  };

  // Copy message text
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Voice Input Toggle (Web Speech API)
  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
      });
    }
  };

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format text with roleplay styling (*actions*)
  const renderMessageContent = (content: string) => {
    // Split by *...* to style asterisks italicized
    const parts = content.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <span key={index} className="italic text-emerald-300/80 font-normal">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-61px)] w-full max-w-5xl mx-auto overflow-hidden bg-[#0b141a] sm:border-x sm:border-slate-800 shadow-2xl relative">
      {/* Top Bar - WhatsApp Style */}
      <header className="px-3 sm:px-4 py-2.5 bg-[#202c33] border-b border-slate-700/60 flex items-center justify-between gap-2 z-20 flex-shrink-0 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Back button */}
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
            title="Back to characters"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Character Avatar & Status */}
          <div
            onClick={onOpenProfileModal}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
            title="View character profile"
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 border border-slate-600 group-hover:border-emerald-400 transition-colors">
                <img
                  src={character.avatar}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#202c33] rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition-colors">
                  {character.name}
                </h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  {character.category}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/90 font-medium truncate flex items-center gap-1">
                {isTyping ? (
                  <span className="text-emerald-300 animate-pulse">typing...</span>
                ) : (
                  <span>online</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Imagine Scene Button */}
          <button
            onClick={onOpenImageModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all cursor-pointer"
            title="Generate a scene illustration with Gemini"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Imagine Scene</span>
          </button>

          {/* Profile / Lore info */}
          <button
            onClick={onOpenProfileModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
            title="Character Details & Lore"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Clear Chat */}
          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Speech Error Banner if permission or browser issue */}
      {speechError && (
        <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2 z-10">
          <span>{speechError}</span>
          <button
            onClick={clearSpeechError}
            className="text-amber-400 hover:text-white font-bold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Messages List (WhatsApp wallpaper) */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3.5 whatsapp-bg relative">
        {/* Date Divider Pill */}
        <div className="flex justify-center my-2 sticky top-2 z-10 pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-[#182229]/90 text-[11px] font-medium text-slate-400 border border-slate-700/40 shadow-sm backdrop-blur-sm">
            Today • Character: {character.name}
          </span>
        </div>

        {/* Messages */}
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isAudioPlaying = isSpeaking && speakingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group/bubble`}
            >
              <div
                className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-md text-sm transition-all ${
                  isUser
                    ? 'bg-[#005c4b] text-slate-100 rounded-tr-xs border border-emerald-600/30'
                    : 'bg-[#202c33] text-slate-100 rounded-tl-xs border border-slate-700/40'
                }`}
              >
                {/* Image Card if message type is image */}
                {msg.type === 'image' && msg.imageUrl && (
                  <div className="mb-2.5 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 relative group/img">
                    <img
                      src={msg.imageUrl}
                      alt={msg.imagePrompt || 'Generated Scene'}
                      className="w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => setPreviewImage({ url: msg.imageUrl!, prompt: msg.imagePrompt })}
                    />

                    {/* Image prompt caption */}
                    {msg.imagePrompt && (
                      <div className="p-2 text-xs bg-slate-900/90 text-slate-300 border-t border-slate-800 line-clamp-2">
                        <span className="text-teal-400 font-semibold mr-1">Prompt:</span>
                        {msg.imagePrompt}
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm p-1 rounded-lg">
                      <button
                        onClick={() => setPreviewImage({ url: msg.imageUrl!, prompt: msg.imagePrompt })}
                        className="p-1 text-slate-200 hover:text-white"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={msg.imageUrl}
                        download={`persona-${character.id}-scene.png`}
                        className="p-1 text-slate-200 hover:text-white"
                        title="Download Image"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Message Text Content */}
                <div className="whitespace-pre-wrap leading-relaxed select-text font-normal">
                  {renderMessageContent(msg.content)}
                </div>

                {/* Footer info: time, read receipt, actions */}
                <div className="flex items-center justify-end gap-2 mt-1 select-none">
                  {/* Character Action Buttons */}
                  {!isUser && (
                    <div className="flex items-center gap-1 mr-auto opacity-70 group-hover/bubble:opacity-100 transition-opacity">
                      {/* Voice Read Aloud Button */}
                      <button
                        onClick={() => speak(msg.content, msg.id, character.voiceConfig)}
                        title={isAudioPlaying ? 'Stop speaking' : 'Read reply aloud'}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isAudioPlaying
                            ? 'text-emerald-400 bg-emerald-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        {isAudioPlaying ? (
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-3 bg-emerald-400 animate-pulse rounded-full" />
                            <span className="w-1.5 h-4 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                            <span className="w-1.5 h-2 bg-emerald-400 animate-pulse delay-150 rounded-full" />
                            <VolumeX className="w-3 h-3 ml-0.5" />
                          </div>
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Regenerate reply button */}
                      <button
                        onClick={() => handleRegenerate(index)}
                        disabled={isTyping}
                        title="Regenerate this response"
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>

                      {/* Copy text */}
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        title="Copy message"
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatTime(msg.timestamp)}
                  </span>

                  {/* Read receipts for user */}
                  {isUser && (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-300 inline" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* WhatsApp Typing Indicator Bubble */}
        {isTyping && (
          <div className="flex items-start">
            <div className="bg-[#202c33] border border-slate-700/40 rounded-2xl rounded-tl-xs px-4 py-3 shadow-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-150" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-300" />
            </div>
          </div>
        )}

        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleSend()}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold cursor-pointer whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area - WhatsApp Mobile Friendly Style */}
      <div className="p-2.5 sm:p-3 bg-[#202c33] border-t border-slate-700/60 flex items-end gap-2 z-20 flex-shrink-0">
        {/* Imagine Scene Trigger */}
        <button
          onClick={onOpenImageModal}
          className="p-2.5 rounded-full text-teal-400 hover:text-teal-300 hover:bg-slate-700/50 transition-colors cursor-pointer flex-shrink-0"
          title="Imagine scene with AI"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Voice Input Mic Button */}
        <button
          onClick={toggleVoiceInput}
          title={isListening ? 'Stop recording voice' : 'Speak message (Microphone)'}
          className={`p-2.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
            isListening
              ? 'bg-rose-500 text-white animate-mic-pulse'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input */}
        <div className="flex-1 bg-[#2a3942] rounded-2xl px-3.5 py-2 border border-slate-600/40 focus-within:border-emerald-500/60 transition-colors">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening to voice...' : `Message ${character.name}...`}
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none resize-none max-h-28 overflow-y-auto"
            style={{ minHeight: '24px' }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isTyping}
          className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer flex-shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>

      {/* Fullscreen Image Preview Lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-3xl max-h-[85vh] flex flex-col items-center">
            <img
              src={previewImage.url}
              alt="Preview"
              className="max-h-[75vh] w-auto rounded-2xl object-contain shadow-2xl border border-slate-700"
            />
            {previewImage.prompt && (
              <p className="mt-3 text-xs sm:text-sm text-slate-300 text-center max-w-xl bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
                {previewImage.prompt}
              </p>
            )}
            <div className="mt-3 flex gap-3">
              <a
                href={previewImage.url}
                download={`persona-${character.id}-scene.png`}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Save Image</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
