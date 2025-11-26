
import React, { useEffect, useRef, useState } from 'react';

interface InteractiveBackgroundProps {
  backgroundImage?: string;
}

export const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({ backgroundImage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle global mouse movement for both Canvas and Image Parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position from -1 to 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- CANVAS LOGIC (Fallback) ---
  useEffect(() => {
    // If we have a background image, don't run the canvas animation
    if (backgroundImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particleCount = Math.min(80, Math.floor((width * height) / 12000)); 
    const connectionDistance = Math.min(width, height) * 0.15;
    const mouseDistance = 250;
    let isDarkMode = document.documentElement.classList.contains('dark');

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          isDarkMode = document.documentElement.classList.contains('dark');
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
    }

    const particles: Particle[] = [];
    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
        });
      }
    };
    initParticles();

    // Local mouse tracker for canvas specific logic
    const canvasMouse = { x: -1000, y: -1000 };
    const updateCanvasMouse = (e: MouseEvent) => {
      canvasMouse.x = e.clientX;
      canvasMouse.y = e.clientY;
    };
    window.addEventListener('mousemove', updateCanvasMouse);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };
    window.addEventListener('resize', handleResize);

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const particleColor = isDarkMode ? 'rgba(56, 189, 248, 0.6)' : 'rgba(2, 132, 199, 0.4)'; 
      const lineColor = isDarkMode ? 'rgba(56, 189, 248, ' : 'rgba(2, 132, 199, ';

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = canvasMouse.x - p.x;
        const dy = canvasMouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseDistance) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouseDistance - distance) / mouseDistance;
          const directionX = forceDirectionX * force * 0.5;
          const directionY = forceDirectionY * force * 0.5;

          p.vx -= directionX;
          p.vy -= directionY;
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSpeed = 1.5;
        if (speed > maxSpeed) {
             p.vx = (p.vx / speed) * maxSpeed;
             p.vy = (p.vy / speed) * maxSpeed;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();

        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (dist2 < connectionDistance) {
            ctx.beginPath();
            const opacity = 1 - dist2 / connectionDistance;
            ctx.strokeStyle = lineColor + (opacity * 0.2) + ')';
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', updateCanvasMouse);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [backgroundImage]);

  if (backgroundImage) {
    // --- IMAGEN PARALLAX BACKGROUND ---
    // Moving opposite to mouse for depth effect
    // Scale is 110% to prevent edges showing during movement
    // Smooth transition for mouse movement
    const transformStyle = {
      transform: `translate3d(${mousePos.x * -15}px, ${mousePos.y * -15}px, 0) scale(1.1)`,
      backgroundImage: `url(${backgroundImage})`,
    };

    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-900">
         <div 
           className="absolute inset-[-5%] w-[110%] h-[110%] bg-cover bg-center transition-transform duration-300 ease-out opacity-90"
           style={transformStyle}
         />
         <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"></div>
         {/* Vignette */}
         <div className="absolute inset-0 bg-[radial-gradient(transparent_40%,rgba(2,6,23,0.8)_100%)]"></div>
         {/* Subtle overlay texture/grid for 'tech' feel */}
         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30"></div>
      </div>
    );
  }

  // --- DEFAULT NEURAL NETWORK ---
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-sky-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-700"></div>
        <canvas ref={canvasRef} className="absolute inset-0 block opacity-80" />
        <div className="absolute inset-0 bg-radial-gradient-transparent dark:bg-[radial-gradient(transparent_0%,rgba(2,6,23,0.4)_100%)]"></div>
    </div>
  );
};
