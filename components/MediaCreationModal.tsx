
import React, { useState } from 'react';
import { MediaGenerationConfig } from '../types';
import { Button } from './Button';

interface MediaCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: MediaGenerationConfig) => void;
  isLoading: boolean;
}

export const MediaCreationModal: React.FC<MediaCreationModalProps> = ({ isOpen, onClose, onGenerate, isLoading }) => {
  const [type, setType] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ type, prompt, aspectRatio, imageSize });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Create Media</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg mb-6">
          <button onClick={() => setType('image')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'image' ? 'bg-white dark:bg-slate-600 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}>Image (Imagen 3)</button>
          <button onClick={() => setType('video')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'video' ? 'bg-white dark:bg-slate-600 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}>Video (Veo)</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Prompt</label>
            <textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent focus:ring-2 focus:ring-brand-500 outline-none h-24 resize-none text-sm dark:text-white"
              placeholder={`Describe the ${type} you want to generate...`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Aspect Ratio</label>
              <select 
                value={aspectRatio} 
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
              >
                <option value="1:1">1:1 (Square)</option>
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="4:3">4:3</option>
                <option value="3:4">3:4</option>
              </select>
            </div>
            
            {type === 'image' && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Resolution</label>
                <select 
                  value={imageSize} 
                  onChange={(e) => setImageSize(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
                >
                  <option value="1K">1K</option>
                  <option value="2K">2K</option>
                  <option value="4K">4K</option>
                </select>
              </div>
            )}
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full mt-4">
            {isLoading ? 'Generating...' : `Generate ${type === 'image' ? 'Image' : 'Video'}`}
          </Button>
        </form>
      </div>
    </div>
  );
};
