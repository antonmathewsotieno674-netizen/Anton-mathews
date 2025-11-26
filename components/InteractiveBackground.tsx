import React, { useEffect, useState } from 'react';

export const InteractiveBackground: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20,
        y: (e.clientY / window.innerHeight) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50"></div>

      {/* Animated Blobs */}
      <div 
        className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"
        style={{ transform: `translate(${mousePosition.x * -1}px, ${mousePosition.y * -1}px)` }}
      ></div>
      <div 
        className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"
        style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y * -1}px)` }}
      ></div>
      <div 
        className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"
        style={{ transform: `translate(${mousePosition.x * -1}px, ${mousePosition.y}px)` }}
      ></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0" style={{ 
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
        backgroundSize: '30px 30px',
        opacity: 0.3
      }}></div>

      {/* Floating Elements (Abstract Notes) */}
      <div className="absolute top-1/4 left-10 w-16 h-20 bg-white border border-slate-200 rounded shadow-sm rotate-12 opacity-40 animate-float"></div>
      <div className="absolute bottom-1/3 right-10 w-20 h-24 bg-white border border-slate-200 rounded shadow-sm -rotate-6 opacity-40 animate-float" style={{ animationDelay: '1s' }}></div>
    </div>
  );
};