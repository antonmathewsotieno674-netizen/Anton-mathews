import React from 'react';

export const ContactSection: React.FC = () => {
  return (
    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Contact Support</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-2">
           <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full text-green-600 dark:text-green-400 mt-0.5">
             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.637 3.891 1.685 5.452l-1.117 4.17 4.167-1.159zm1.5-7.95l.407.663c.105.17.22.348.337.525.632.96 1.64 1.761 2.766 2.201.216.085.397.161.547.234l.322.156c.773.376 1.344.417 1.77.37.514-.055 1.15-.468 1.443-1.282.083-.23.136-.456.162-.644l.006-.039c.026-.184.004-.265-.078-.308-.225-.116-1.188-.59-1.423-.703l-.089-.043c-.159-.076-.289-.092-.41.091-.129.195-.53.673-.654.819-.11.129-.219.145-.444.032-.224-.11-1.084-.403-2.028-1.246-.667-.595-1.076-1.332-1.205-1.554-.128-.22-.014-.336.096-.445.097-.096.216-.25.323-.377.032-.039.066-.078.099-.118.175-.213.232-.303.344-.525.113-.222.057-.417-.028-.588-.084-.169-.747-1.804-1.026-2.47-.267-.633-.535-.547-.732-.555l-.197-.003c-.207-.003-.548.006-.856.347-.282.312-1.077 1.053-1.077 2.569 0 1.515 1.103 2.979 1.257 3.186l.019.025z"/></svg>
           </div>
           <div>
             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">WhatsApp</p>
             <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">0757 634590</p>
           </div>
        </div>

        <div className="flex items-start gap-2">
           <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full text-blue-600 dark:text-blue-400 mt-0.5">
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
           </div>
           <div>
             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Call Us</p>
             <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">0731 176 583</p>
           </div>
        </div>

        <div className="flex items-start gap-2">
           <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-full text-purple-600 dark:text-purple-400 mt-0.5">
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
           </div>
           <div className="overflow-hidden">
             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Email</p>
             <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 break-all">moa@moana.com</p>
           </div>
        </div>
      </div>
    </div>
  );
};