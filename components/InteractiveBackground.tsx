
import React, { useEffect, useRef, useState } from 'react';

interface InteractiveBackgroundProps {
  backgroundImage?: string;
}

export const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({ backgroundImage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle global mouse movement for both Canvas interactions and Image Parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position from -1 to 1 for parallax
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- CANVAS PARTICLE SYSTEM ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Adjust particle count based on background presence to avoid clutter
    const particleCount = backgroundImage 
      ? Math.min(50, Math.floor((width * height) / 18000)) // Fewer particles if image exists
      : Math.min(80, Math.floor((width * height) / 12000));
      
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

      // Adjust opacity/color based on background presence
      let particleColor, lineColor;
      
      if (backgroundImage) {
        // Lighter, more subtle particles over an image
        particleColor = 'rgba(255, 255, 255, 0.5)';
        lineColor = 'rgba(255, 255, 255, ';
      } else {
        // Cyan/Teal branding colors for blue-green theme
        // Brighter particles for dark mode
        particleColor = isDarkMode ? 'rgba(45, 212, 191, 0.8)' : 'rgba(13, 148, 136, 0.4)'; 
        lineColor = isDarkMode ? 'rgba(45, 212, 191, ' : 'rgba(13, 148, 136, ';
      }

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = canvasMouse.x - p.x;
        const dy = canvasMouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Interactive repulsion
        if (distance < mouseDistance) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouseDistance - distance) / mouseDistance;
          const directionX = forceDirectionX * force * 0.5;
          const directionY = forceDirectionY * force * 0.5;

          p.vx -= directionX;
          p.vy -= directionY;
        }

        // Speed limit
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSpeed = 1.5;
        if (speed > maxSpeed) {
             p.vx = (p.vx / speed) * maxSpeed;
             p.vy = (p.vy / speed) * maxSpeed;
        }

        // Draw Particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();

        // Draw Connections
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (dist2 < connectionDistance) {
            ctx.beginPath();
            const opacity = (1 - dist2 / connectionDistance) * (backgroundImage ? 0.15 : 0.2);
            ctx.strokeStyle = lineColor + opacity + ')';
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

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-teal-50 dark:bg-teal-950">
       
       {/* Layer 1: Background Image or Gradient */}
       {backgroundImage ? (
          <div 
             className="absolute inset-[-5%] w-[110%] h-[110%] bg-cover bg-center transition-transform duration-300 ease-out opacity-90"
             style={{
               transform: `translate3d(${mousePos.x * -15}px, ${mousePos.y * -15}px, 0) scale(1.1)`,
               backgroundImage: `url(${backgroundImage})`,
             }}
           />
       ) : (
          // Brighter Blue-Green Gradient
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-cyan-100 to-emerald-50 dark:from-teal-900 dark:via-cyan-950 dark:to-emerald-900 transition-colors duration-700 opacity-90"></div>
       )}

       {/* Layer 2: Overlay Texture & Vignette */}
       <div className={`absolute inset-0 ${backgroundImage ? 'bg-slate-900/30' : 'bg-transparent'}`}></div>
       <div className="absolute inset-0 bg-radial-gradient-transparent dark:bg-[radial-gradient(transparent_0%,rgba(4,47,46,0.2)_100%)]"></div>
       {backgroundImage && <div className="absolute inset-0 bg-[radial-gradient(transparent_40%,rgba(2,6,23,0.8)_100%)]"></div>}
       <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30"></div>

       {/* Layer 3: Interactive Particles */}
       <canvas ref={canvasRef} className={`absolute inset-0 block ${backgroundImage ? 'mix-blend-screen' : ''}`} />
    </div>
  );
};
