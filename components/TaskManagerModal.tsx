
import React, { useState } from 'react';
import { ActionItem } from '../types';
import { Button } from './Button';

interface TaskManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: ActionItem[];
  isLoading: boolean;
}

export const TaskManagerModal: React.FC<TaskManagerModalProps> = ({ isOpen, onClose, tasks, isLoading }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddToTodoist = (content: string) => {
    // Todoist URL Scheme to add a task
    const url = `https://todoist.com/add?content=${encodeURIComponent(content)}&date=Today`;
    window.open(url, '_blank');
  };

  const handleAddToCalendar = (content: string) => {
    // Google Calendar URL Scheme
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(content)}&details=Generated+by+MOA+AI`;
    window.open(url, '_blank');
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] transition-colors border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Actionable Tasks</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generated from your notes & chat</p>
          </div>
          <button 
             onClick={onClose}
             className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 dark:bg-slate-900/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
               <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
               <p className="text-sm text-slate-500 animate-pulse">Analyzing notes for tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No specific tasks found.</p>
              <p className="text-xs mt-1">Try uploading more content or asking specific questions first.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3 group hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
                  <div className="flex items-start gap-3">
                     <div className="mt-0.5 min-w-[1.25rem]">
                        <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600"></div>
                     </div>
                     <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{task.content}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pl-8">
                     <button 
                       onClick={() => handleAddToTodoist(task.content)}
                       className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                       title="Create task in Todoist"
                     >
                       <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 17.373 0 12 5.373 0 12 0zm0 4a8 8 0 100 16 8 8 0 000-16z"/></svg>
                       Add to Todoist
                     </button>

                     <button 
                       onClick={() => handleAddToCalendar(task.content)}
                       className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                       title="Create event in Google Calendar"
                     >
                       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                       Add to Google Calendar
                     </button>

                     <button 
                       onClick={() => handleCopy(task.id, task.content)}
                       className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ml-auto border ${
                         copiedId === task.id 
                           ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                           : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border-transparent'
                       }`}
                       title="Copy task text for Asana or other tools"
                     >
                       {copiedId === task.id ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Copied
                          </>
                       ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            Copy Text
                          </>
                       )}
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
