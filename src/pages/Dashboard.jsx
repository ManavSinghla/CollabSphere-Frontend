import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useWorkspaceStore from '../store/workspaceStore';
import Chat from '../components/Chat';
import Documents from '../components/Documents';
import ProfileSettings from '../components/ProfileSettings';
import { LogOut, MessageSquare, FileText, Settings, User, Plus, ChevronDown, Check } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { workspaces, currentWorkspace, fetchWorkspaces, createWorkspace, setCurrentWorkspace, isLoading } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState('chat');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreateWorkspace = (e) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
      createWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setIsCreatingWorkspace(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (memberEmail.trim() && currentWorkspace) {
      try {
        await useWorkspaceStore.getState().addMember(currentWorkspace._id, memberEmail);
        setMemberEmail('');
        setIsInvitingMember(false);
        alert('Member added successfully!');
      } catch (err) {
        alert(err);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-20 lg:w-64 flex flex-col bg-surface border-r border-slate-800/60 shadow-xl z-20 transition-all duration-300">
        <div className="p-4 border-b border-slate-800/60 relative">
          <button 
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="w-full flex items-center justify-center lg:justify-between gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0 text-white font-bold text-lg">
                {currentWorkspace ? currentWorkspace.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="hidden lg:block text-left overflow-hidden">
                <p className="font-semibold text-white truncate">{currentWorkspace ? currentWorkspace.name : 'Select Workspace'}</p>
                <p className="text-xs text-slate-400">Free Plan</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 hidden lg:block transition-transform ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Workspace Dropdown */}
          {showWorkspaceDropdown && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-3 pb-2 mb-2 border-b border-slate-700">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Workspaces</p>
              </div>
              <div className="max-h-48 overflow-y-auto px-2 space-y-1">
                {workspaces.map(ws => (
                  <button
                    key={ws._id}
                    onClick={() => { setCurrentWorkspace(ws); setShowWorkspaceDropdown(false); }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-700 text-left transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-200 truncate">{ws.name}</span>
                    {currentWorkspace?._id === ws._id && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                ))}
              </div>
              <div className="px-2 mt-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => { setIsCreatingWorkspace(true); setShowWorkspaceDropdown(false); }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-500/10 text-indigo-400 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create Workspace
                </button>
                <button
                  onClick={() => { setIsInvitingMember(true); setShowWorkspaceDropdown(false); }}
                  className="w-full flex items-center gap-2 p-2 mt-1 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  Invite Member
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 py-6 px-3 space-y-2">
          <NavItem 
            icon={<MessageSquare className="w-5 h-5" />} 
            label="Chat" 
            isActive={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
          />
          <NavItem 
            icon={<FileText className="w-5 h-5" />} 
            label="Documents" 
            isActive={activeTab === 'docs'} 
            onClick={() => setActiveTab('docs')} 
          />
          <NavItem 
            icon={<Settings className="w-5 h-5" />} 
            label="Settings" 
            isActive={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </div>

        <div className="p-4 border-t border-slate-800/60 space-y-4">
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-indigo-500/50 object-cover" />
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center lg:justify-start gap-3 p-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block text-sm font-medium">Log out</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B]/50">
        <header className="h-16 flex items-center px-6 border-b border-slate-800/60 bg-surface/50 backdrop-blur-md sticky top-0 z-10 justify-between">
          <h1 className="text-xl font-semibold text-white capitalize">{activeTab}</h1>
          {currentWorkspace && (
            <button
              onClick={() => setIsInvitingMember(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors text-sm font-medium border border-indigo-500/20"
            >
              <User className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'chat' && (
            <div className="h-full">
              <Chat />
            </div>
          )}
          {activeTab === 'docs' && (
            <div className="h-full">
              <Documents />
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="h-full">
              <ProfileSettings />
            </div>
          )}
        </div>
      </main>

      {/* Create Workspace Modal */}
      {isCreatingWorkspace && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Create a new workspace</h2>
            <p className="text-slate-400 text-sm mb-6">Workspaces are where your team communicates and collaborates.</p>
            
            <form onSubmit={handleCreateWorkspace}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Workspace Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="e.g. Acme Corp, Engineering Team"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingWorkspace(false)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newWorkspaceName.trim()}
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Invite Member Modal */}
      {isInvitingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Invite a Member</h2>
            <p className="text-slate-400 text-sm mb-6">Add someone to <strong>{currentWorkspace?.name}</strong>.</p>
            
            <form onSubmit={handleInviteMember}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="name@example.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInvitingMember(false)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!memberEmail.trim()}
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
        isActive 
          ? 'bg-indigo-500/10 text-indigo-400 relative' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
      )}
      <div className={`${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
        {icon}
      </div>
      <span className="hidden lg:block font-medium text-sm">{label}</span>
    </button>
  );
}
