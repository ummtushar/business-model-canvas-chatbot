'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Save, Trash2 } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type SavedChat = {
  id: string;
  name: string;
};

type Model = 'VPC' | 'BMC';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchSavedChats();
  }, []);

  const fetchSavedChats = async () => {
    // ... (keep existing fetchSavedChats code)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedModel) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setUnsavedChanges(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [...messages, userMessage], model: selectedModel }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'An error occurred. Please try again.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'An error occurred. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveChat = async () => {
    if (messages.length === 0) return;

    const chatId = currentChatId || Date.now().toString(); // Generate new chatId if no currentChatId
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'save', chatId, messages }), // Send the messages to the API
      });

      if (response.ok) {
        // Add the chat to saved chats if it's new
        if (!currentChatId) {
          setSavedChats((prev) => [...prev, { id: chatId, name: `Chat ${prev.length + 1}` }]);
        }

        // Clear the current messages to start a fresh chat
        setMessages([]);
        setInput('');
        setCurrentChatId(null); // Reset the currentChatId to signal a new chat
        setUnsavedChanges(false); // Reset unsaved changes
      } else {
        console.error('Error saving chat:', await response.text());
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  const loadChat = async (chatId: string) => {
    if (unsavedChanges && !window.confirm('You have unsaved changes. Continue without saving?')) {
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'load', chatId }), // Ensure the correct payload is sent
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages); // Set the messages in the state
          setCurrentChatId(chatId); // Set the currentChatId in the state
          setUnsavedChanges(false); // Reset unsaved changes after loading
        } else {
          console.error('Failed to load chat:', data.message);
        }
      } else {
        console.error('Error loading chat:', await response.text());
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete', chatId }),
      });

      if (response.ok) {
        setSavedChats((prev) => prev.filter((chat) => chat.id !== chatId));
        if (currentChatId === chatId) {
          setMessages([]);
          setCurrentChatId(null);
          setUnsavedChanges(false); // Reset unsaved changes on delete
        }
      } else {
        console.error('Error deleting chat:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleModelSelection = (model: Model) => {
    setSelectedModel(model);
    setMessages([]);
    setCurrentChatId(null);
    setUnsavedChanges(false);
  };

  if (!mounted) return null;

  if (!selectedModel) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
            Choose a Model
          </h2>
          <div className="flex space-x-4">
            <button
              onClick={() => handleModelSelection('VPC')}
              className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              VPC
            </button>
            <button
              onClick={() => handleModelSelection('BMC')}
              className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              BMC
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Saved Chats</h2>
        {savedChats.map((chat) => (
          <div key={chat.id} className="flex items-center justify-between mb-2">
            <button
              onClick={() => loadChat(chat.id)}
              className={`text-left ${
                currentChatId === chat.id ? 'font-bold' : ''
              } text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white`}
            >
              {chat.name}
            </button>
            <button onClick={() => deleteChat(chat.id)} className="text-red-500 hover:text-red-700">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            {selectedModel === 'VPC' ? 'Value Proposition Canvas' : 'Business Model Canvas'} Chatbot
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedModel(null)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Change Model
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === 'user' ? 'bg-blue-100 dark:bg-blue-900 ml-auto' : 'bg-gray-100 dark:bg-gray-700'
              } max-w-3/4`}
            >
              <p className="font-semibold">{message.role === 'user' ? 'You:' : 'AI:'}</p>
              <div dangerouslySetInnerHTML={{ __html: message.content }} />
            </div>
          ))}
          {isLoading && (
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
              <p className="font-semibold">AI is thinking...</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              Send
            </button>
            <button
              type="button"
              onClick={saveChat}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              <Save className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}