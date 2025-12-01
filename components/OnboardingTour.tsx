
import React, { useState, useEffect } from 'react';
import { Button } from './Button';

interface Step {
  targetId: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS: Step[] = [
  {
    targetId: 'upload-area',
    title: 'Upload Your Notes',
    description: 'Start by uploading PDF, Word, or Image files here. You can also take a photo or access cloud storage.',
    position: 'right'
  },
  {
    targetId: 'model-selector',
    title: 'Choose Your AI Mode',
    description: 'Select "Fast" for quick answers, "Deep Think" for complex problems, or "Maps" for location info.',
    position: 'top'
  },
  {
    targetId: 'chat-input-area',
    title: 'Ask Questions',
    description: 'Type your questions here. You can ask for summaries, specific details, or quiz questions.',
    position: 'top'
  },
  {
    targetId: 'tasks-button',
    title: 'Generate Tasks',
    description: 'Turn your notes into actionable to-do lists and export them to your favorite tools.',
    position: 'bottom'
  },
  {
    targetId: 'settings-button',
    title: 'Profile & Library',
    description: 'Manage your account, view payment history, and browse the Community Library here.',
    position: 'left'
  }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const step = STEPS[currentStep];
      const element = document.getElementById(step.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Skip step if element not found (e.g. mobile vs desktop layout differences)
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onClose();
        }
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    // slight delay to allow layout to settle
    const timer = setTimeout(updatePosition, 300);

    return () => {
      window.removeEventListener('resize', updatePosition);
      clearTimeout(timer);
    };
  }, [isOpen, currentStep, onClose]);

  if (!isOpen || !targetRect) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  // Simple positioning logic
  const isMobile = window.innerWidth < 768;
  const pos = isMobile ? 'bottom' : (step.position || 'bottom');
  
  let tooltipStyle: React.CSSProperties = { position: 'absolute' };
  
  if (pos === 'bottom') {
    tooltipStyle.top = targetRect.bottom + 16;
    tooltipStyle.left = targetRect.left + (targetRect.width / 2) - 160;
  } else if (pos === 'top') {
    tooltipStyle.bottom = window.innerHeight - targetRect.top + 16;
    tooltipStyle.left = targetRect.left + (targetRect.width / 2) - 160;
  } else if (pos === 'left') {
    tooltipStyle.top = targetRect.top;
    tooltipStyle.right = window.innerWidth - targetRect.left + 16;
  } else if (pos === 'right') {
    tooltipStyle.top = targetRect.top;
    tooltipStyle.left = targetRect.right + 16;
  }

  // Basic viewport boundary handling
  if (typeof tooltipStyle.left === 'number') {
     if (tooltipStyle.left < 10) tooltipStyle.left = 10;
     if (tooltipStyle.left > window.innerWidth - 330) tooltipStyle.left = window.innerWidth - 330;
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      {/* Dimmed Background Spotlight Effect */}
      <div 
        className="absolute transition-all duration-300 ease-in-out border-2 border-brand-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
      />

      {/* Tooltip Card */}
      <div 
        className="absolute pointer-events-auto w-80 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-300 flex flex-col gap-3 z-[101]"
        style={tooltipStyle}
      >
        <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                Step {currentStep + 1} of {STEPS.length}
            </span>
            <button onClick={handleSkip} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                Skip
            </button>
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{step.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {step.description}
        </p>
        <div className="flex justify-end gap-2 mt-2">
            <Button size="sm" onClick={handleNext}>
                {isLastStep ? 'Get Started' : 'Next'}
            </Button>
        </div>
      </div>
    </div>
  );
};
