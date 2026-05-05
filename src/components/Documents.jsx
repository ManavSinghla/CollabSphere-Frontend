import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import useDocumentStore from '../store/documentStore';
import useWorkspaceStore from '../store/workspaceStore';
import { FileText, Plus, Users, Clock } from 'lucide-react';

export default function Documents() {
  const { currentWorkspace } = useWorkspaceStore();
  const { 
    documents, 
    currentDocument, 
    fetchDocuments, 
    setCurrentDocument, 
    updateDocumentContent, 
    connectSocket, 
    disconnectSocket,
    createDocument
  } = useDocumentStore();

  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');

  // Handle Quill change safely
  const [editorValue, setEditorValue] = useState('');

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, [connectSocket, disconnectSocket]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchDocuments(currentWorkspace._id);
    }
  }, [currentWorkspace, fetchDocuments]);

  useEffect(() => {
    if (currentDocument) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditorValue(currentDocument.content || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDocument?.content, currentDocument?._id]);

  const handleCreateDocument = (e) => {
    e.preventDefault();
    if (newDocumentTitle.trim() && currentWorkspace) {
      createDocument(currentWorkspace._id, newDocumentTitle);
      setNewDocumentTitle('');
      setIsCreatingDocument(false);
    }
  };

  const handleEditorChange = (content) => {
    setEditorValue(content);
    updateDocumentContent(content);
  };

  if (!currentWorkspace) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <Users className="w-16 h-16 mb-4 text-slate-600" />
        <h3 className="text-xl text-white font-medium mb-2">No Workspace Selected</h3>
        <p>Please select or create a workspace to manage documents.</p>
      </div>
    );
  }

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image', 'code-block'],
      ['clean']
    ],
  };

  return (
    <div className="flex h-full bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-800/60 shadow-2xl document-container">
      {/* Sidebar for Documents */}
      <div className="w-64 bg-surface border-r border-slate-800/60 flex flex-col z-10">
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400"/> Documents
          </h2>
          <button 
            onClick={() => setIsCreatingDocument(true)}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {documents.map(doc => (
            <button
              key={doc._id}
              onClick={() => setCurrentDocument(doc)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                currentDocument?._id === doc._id 
                  ? 'bg-indigo-500 text-white font-medium shadow-md shadow-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <FileText className={`w-4 h-4 ${currentDocument?._id === doc._id ? 'text-indigo-200' : 'opacity-70'}`} />
              <div className="text-left truncate flex-1">
                <p className="truncate leading-tight">{doc.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[#0F172A] relative">
        {currentDocument ? (
          <>
            <div className="h-14 border-b border-slate-800/60 flex items-center justify-between px-6 bg-surface/30 backdrop-blur-sm">
              <h3 className="text-white font-medium flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-indigo-400" />
                {currentDocument.title}
              </h3>
              <div className="flex items-center text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">
                <Clock className="w-3 h-3 mr-1" /> Auto-saving
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-white editor-wrapper">
              <ReactQuill 
                theme="snow" 
                value={editorValue} 
                onChange={handleEditorChange}
                modules={modules}
                className="h-full"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FileText className="w-16 h-16 mb-4 text-slate-600" />
            <h3 className="text-xl text-white font-medium mb-2">No Document Selected</h3>
            <p>Select a document from the sidebar to start editing.</p>
          </div>
        )}
      </div>

      {/* Create Document Modal */}
      {isCreatingDocument && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create a new document</h2>
            <form onSubmit={handleCreateDocument}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Document Title</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="e.g. Project Specs, Meeting Notes"
                    value={newDocumentTitle}
                    onChange={(e) => setNewDocumentTitle(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingDocument(false)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newDocumentTitle.trim()}
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Create Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
