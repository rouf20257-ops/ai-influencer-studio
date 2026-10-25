import React, { useState } from 'react';
import { Character, ChatMessage } from './types/character';
import { storageService } from './services/storageService';
import { useSpeech } from './hooks/useSpeech';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ChatView } from './components/ChatView';
import { VideoStudio } from './components/VideoStudio';
import { CreateCharacterModal } from './components/CreateCharacterModal';
import { GenerateImageModal } from './components/GenerateImageModal';
import { CharacterProfileModal } from './components/CharacterProfileModal';

export default function App() {
  const [characters, setCharacters] = useState<Character[]>(() =>
    storageService.getAllCharacters()
  );
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'chat' | 'video'>('home');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Home voice preview hook
  const { speak, stopSpeaking, isSpeaking, speakingMessageId } = useSpeech();

  // Reload characters from storage
  const reloadCharacters = () => {
    setCharacters(storageService.getAllCharacters());
  };

  // Launch chat with selected character
  const handleSelectCharacter = (character: Character) => {
    stopSpeaking();
    setSelectedCharacter(character);
    setActiveView('chat');
  };

  // Return to home
  const handleBackToHome = () => {
    stopSpeaking();
    setActiveView('home');
  };

  // Switch to Video Studio
  const handleOpenVideoStudio = () => {
    stopSpeaking();
    setActiveView('video');
  };

  // Save new custom character
  const handleSaveCharacter = (newChar: Character) => {
    storageService.saveCustomCharacter(newChar);
    reloadCharacters();
    setIsCreateModalOpen(false);
    // Directly open chat with the newly created character!
    handleSelectCharacter(newChar);
  };

  // Delete custom character
  const handleDeleteCharacter = (id: string) => {
    storageService.deleteCustomCharacter(id);
    reloadCharacters();
    if (selectedCharacter?.id === id) {
      setActiveView('home');
      setSelectedCharacter(null);
    }
  };

  // Voice preview greeting on character card
  const handleSpeakGreeting = (character: Character) => {
    const cardMsgId = 'card-' + character.id;
    if (isSpeaking && speakingMessageId === cardMsgId) {
      stopSpeaking();
    } else {
      speak(character.greeting, cardMsgId, character.voiceConfig);
    }
  };

  // Handle scene image generation insert into chat
  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    if (!selectedCharacter) return;

    const currentHistory = storageService.getChatHistory(selectedCharacter);

    // 1. Add image message from user / scene prompt
    const imageMsg: ChatMessage = {
      id: 'img-' + Date.now(),
      role: 'user',
      content: `I've illustrated a scene: "${prompt}"`,
      timestamp: Date.now(),
      type: 'image',
      imageUrl,
      imagePrompt: prompt,
    };

    // 2. Add companion's reaction message
    const reactionMsg: ChatMessage = {
      id: 'react-' + Date.now(),
      role: 'model',
      content: `*gazes with awe at the scene* "Look at this marvelous scene! You captured the mood perfectly. Seeing this makes our journey feel so much more real."`,
      timestamp: Date.now() + 500,
      type: 'text',
    };

    const updated = [...currentHistory, imageMsg, reactionMsg];
    storageService.saveChatHistory(selectedCharacter.id, updated);

    // Force refresh chat view by re-setting state
    setSelectedCharacter({ ...selectedCharacter });
  };

  // Handle clear chat from profile modal
  const handleClearChatFromProfile = () => {
    if (!selectedCharacter) return;
    storageService.clearChatHistory(selectedCharacter);
    setSelectedCharacter({ ...selectedCharacter });
  };

  return (
    <div className="min-h-screen bg-[#0b141a] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateClick={() => setIsCreateModalOpen(true)}
        onHomeClick={handleBackToHome}
        onVideoStudioClick={handleOpenVideoStudio}
        activeView={activeView}
        customCount={characters.filter(c => c.isCustom).length}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeView === 'video' ? (
          <VideoStudio />
        ) : activeView === 'home' ? (
          <HomeView
            characters={characters}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectCharacter={handleSelectCharacter}
            onCreateCharacter={() => setIsCreateModalOpen(true)}
            onDeleteCharacter={handleDeleteCharacter}
            onSpeakGreeting={handleSpeakGreeting}
            speakingMessageId={speakingMessageId}
            searchQuery={searchQuery}
          />
        ) : selectedCharacter ? (
          <ChatView
            key={selectedCharacter.id}
            character={selectedCharacter}
            onBack={handleBackToHome}
            onOpenImageModal={() => setIsImageModalOpen(true)}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
          />
        ) : null}
      </main>

      {/* Modals */}
      <CreateCharacterModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveCharacter}
      />

      {selectedCharacter && (
        <>
          <GenerateImageModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            character={selectedCharacter}
            onImageGenerated={handleImageGenerated}
          />

          <CharacterProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            character={selectedCharacter}
            onClearChat={handleClearChatFromProfile}
          />
        </>
      )}
    </div>
  );
}
