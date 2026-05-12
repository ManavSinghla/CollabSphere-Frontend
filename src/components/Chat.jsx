import { useEffect, useState, useRef } from 'react';
import useChatStore from '../store/chatStore';
import useWorkspaceStore from '../store/workspaceStore';
import useAuthStore from '../store/authStore';
import { Hash, Send, Plus, Users, Paperclip, X, Download } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Chat() {
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const { 
    channels, 
    currentChannel, 
    messages, 
    fetchChannels, 
    setCurrentChannel, 
    sendMessage, 
    connectSocket, 
    disconnectSocket,
    createChannel
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, [connectSocket, disconnectSocket]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchChannels(currentWorkspace._id);
    }
  }, [currentWorkspace, fetchChannels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;

    let uploadedAttachments = [];
    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.post(`${API_URL}/api/upload`, formData, config);
        uploadedAttachments.push(data.url);
      } catch (err) {
        console.error('Upload failed', err);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMessage(messageText, uploadedAttachments);
    setMessageText('');
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (newChannelName.trim() && currentWorkspace) {
      createChannel(currentWorkspace._id, newChannelName.toLowerCase().replace(/\s+/g, '-'));
      setNewChannelName('');
      setIsCreatingChannel(false);
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <Users className="w-16 h-16 mb-4 text-slate-600" />
        <h3 className="text-xl text-white font-medium mb-2">No Workspace Selected</h3>
        <p>Please select or create a workspace to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-800/60 shadow-2xl">
      {/* Channels Sidebar */}
      <div className="w-64 bg-surface border-r border-slate-800/60 flex flex-col">
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Hash className="w-4 h-4 text-slate-400"/> Channels
          </h2>
          <button 
            onClick={() => setIsCreatingChannel(true)}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {channels.map(channel => (
            <button
              key={channel._id}
              onClick={() => setCurrentChannel(channel)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                currentChannel?._id === channel._id 
                  ? 'bg-indigo-500/20 text-indigo-400 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Hash className="w-4 h-4 opacity-70" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0F172A] relative">
        {currentChannel ? (
          <>
            <div className="h-14 border-b border-slate-800/60 flex items-center px-6 bg-surface/30 backdrop-blur-sm">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Hash className="w-5 h-5 text-slate-400" />
                {currentChannel.name}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, index) => {
                const isMine = msg.senderId._id === user._id;
                return (
                  <div key={index} className={`flex gap-4 ${isMine ? 'flex-row-reverse' : ''}`}>
                    <img 
                      src={msg.senderId.avatar} 
                      alt={msg.senderId.name} 
                      className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                    />
                    <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-300">{msg.senderId.name}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-md ${
                        isMine 
                          ? 'bg-indigo-500 text-white rounded-tr-sm' 
                          : 'bg-surface text-slate-200 border border-slate-700/50 rounded-tl-sm'
                      }`}>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mb-2">
                            {msg.attachments.map((url, i) => {
                              const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.includes('res.cloudinary.com/v');
                              
                              return isImage ? (
                                <div key={i} className="relative group inline-block mb-2">
                                  <img src={url} alt="attachment" className="rounded-lg max-w-xs max-h-64 object-contain" />
                                  <a href={url} target="_blank" rel="noreferrer" download className="absolute bottom-2 right-2 bg-slate-900/70 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-500">
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              ) : (
                                <a key={i} href={url} target="_blank" rel="noreferrer" download className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg text-indigo-300 hover:text-indigo-200 text-xs mb-2 w-max border border-slate-700/50">
                                  <Download className="w-4 h-4" /> Download File
                                </a>
                              );
                            })}
                          </div>
                        )}
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-800/60 bg-surface/30">
              {selectedFile && (
                <div className="mb-3 flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700 w-max">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300 truncate max-w-[200px]">{selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-4 rounded-xl transition-colors flex items-center justify-center"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder={`Message #${currentChannel.name}`}
                  className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isUploading}
                />
                <button
                  type="submit"
                  disabled={isUploading || (!messageText.trim() && !selectedFile)}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-indigo-500/20"
                >
                  <Send className={`w-5 h-5 ${isUploading ? 'animate-pulse' : ''}`} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Hash className="w-16 h-16 mb-4 text-slate-600" />
            <h3 className="text-xl text-white font-medium mb-2">No Channel Selected</h3>
            <p>Select a channel from the sidebar to start chatting.</p>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      {isCreatingChannel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create a channel</h2>
            <form onSubmit={handleCreateChannel}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Channel Name</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="e.g. general, announcements"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingChannel(false)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newChannelName.trim()}
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
