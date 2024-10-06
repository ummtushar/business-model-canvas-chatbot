// 'use client'

// import { useState, useEffect } from 'react'
// import { useTheme } from 'next-themes'
// import { Moon, Sun } from 'lucide-react'

// type Message = {
//   role: 'user' | 'assistant'
//   content: string
// }

// export default function ChatInterface() {
//   const [messages, setMessages] = useState<Message[]>([])
//   const [input, setInput] = useState('')
//   const [isLoading, setIsLoading] = useState(false)
//   const [mounted, setMounted] = useState(false)
//   const { theme, setTheme } = useTheme()

//   useEffect(() => {
//     setMounted(true)
//   }, [])

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!input.trim()) return

//     const userMessage: Message = { role: 'user', content: input }
//     setMessages((prev) => [...prev, userMessage])
//     setInput('')
//     setIsLoading(true)

//     try {
//       const response = await fetch('/api/chat', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ messages: [...messages, userMessage] }),
//       })

//       if (!response.ok) {
//         throw new Error('Failed to fetch response')
//       }

//       const data = await response.json()
//       setMessages((prev) => [...prev, { role: 'assistant', content: data.content }])
//     } catch (error) {
//       console.error('Error:', error)
//       setMessages((prev) => [
//         ...prev,
//         { role: 'assistant', content: 'An error occurred. Please try again.' },
//       ])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   if (!mounted) return null

//   return (
//     <div className="container mx-auto p-4">
//       <div className="w-full max-w-2xl mx-auto bg-card text-card-foreground rounded-lg shadow-md">
//         <div className="flex flex-row items-center justify-between p-4 border-b">
//           <h1 className="text-xl font-bold">Business Model Canvas Chatbot</h1>
//           <button
//             className="p-2 rounded-full bg-secondary text-secondary-foreground"
//             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
//           >
//             {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
//             <span className="sr-only">Toggle theme</span>
//           </button>
//         </div>
//         <div className="p-4 space-y-4 h-[60vh] overflow-y-auto">
//           {messages.map((message, index) => (
//             <div
//               key={index}
//               className={`p-2 rounded-lg ${
//                 message.role === 'user'
//                   ? 'bg-primary text-primary-foreground'
//                   : 'bg-secondary text-secondary-foreground'
//               }`}
//             >
//               <p className="font-semibold">{message.role === 'user' ? 'You:' : 'AI:'}</p>
//               <p>{message.content}</p>
//             </div>
//           ))}
//           {isLoading && (
//             <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
//               <p className="font-semibold">AI is thinking...</p>
//             </div>
//           )}
//         </div>
//         <div className="p-4 border-t">
//           <form onSubmit={handleSubmit} className="flex space-x-2">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Type your message..."
//               className="flex-grow p-2 border rounded-md bg-background text-foreground"
//             />
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
//             >
//               Send
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }

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

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false); // Track unsaved changes

  useEffect(() => {
    setMounted(true);
    fetchSavedChats();
  }, []);

  const fetchSavedChats = async () => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'getSavedChats' }),
    });

    if (response.ok) {
      const data = await response.json();
      setSavedChats(data.chats || []);  // Load saved chats or empty array if none exist
    } else {
      console.error('Error fetching saved chats:', await response.text());
      setSavedChats([]); // Default to empty array in case of an error
    }
  } catch (error) {
    console.error('Error fetching saved chats:', error);
    setSavedChats([]); // Default to empty array in case of an error
  }
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setUnsavedChanges(true); // Mark unsaved changes

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
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
    } catch (error) {
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

  if (!mounted) return null;

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
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Business Model Canvas Chatbot</h1>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
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
              <p>{message.content}</p>
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
