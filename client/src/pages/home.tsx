import { useWhiteNoise } from "@/hooks/use-white-noise";
import { Play, Pause, Moon, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import moonImage from "@assets/generated_images/cute_sleeping_moon_character_illustration.png";

export default function Home() {
  const { isPlaying, volume, setVolume, togglePlay } = useWhiteNoise();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,hsl(250,30%,25%),hsl(220,25%,15%))]" />
      
      {/* Animated Stars (CSS simplified) */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              opacity: Math.random(),
              animation: `pulse ${Math.random() * 3 + 2}s infinite`
            }}
          />
        ))}
      </div>

      <main className="w-full max-w-md z-10 flex flex-col items-center gap-12">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display font-bold text-primary tracking-tight">
            BabySleep
          </h1>
          <p className="text-muted-foreground font-medium">
            Soothing sounds for sweet dreams
          </p>
        </div>

        {/* Visualizer / Avatar */}
        <div className="relative group">
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
              />
            )}
          </AnimatePresence>
          
          <motion.div 
            animate={isPlaying ? { 
              y: [0, -10, 0],
              rotate: [0, 2, -2, 0]
            } : {
              y: 0,
              rotate: 0
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 4, 
              ease: "easeInOut" 
            }}
            className="relative z-10 w-64 h-64 rounded-full bg-secondary/30 backdrop-blur-sm border-4 border-white/5 flex items-center justify-center shadow-2xl overflow-hidden"
          >
             <img 
               src={moonImage} 
               alt="Sleeping Moon" 
               className="w-full h-full object-cover opacity-90"
             />
          </motion.div>
        </div>

        {/* Controls */}
        <div className="w-full space-y-10">
          
          {/* Play Button */}
          <div className="flex justify-center">
            <button
              onClick={togglePlay}
              data-testid="button-play-pause"
              className={`
                relative group flex items-center justify-center w-24 h-24 rounded-full transition-all duration-500
                ${isPlaying 
                  ? 'bg-primary text-primary-foreground shadow-[0_0_40px_hsl(var(--primary)/0.4)]' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-lg'}
              `}
            >
              {isPlaying ? (
                <Pause className="w-10 h-10 fill-current" />
              ) : (
                <Play className="w-10 h-10 fill-current ml-1" />
              )}
              
              {/* Ripple Effect Ring */}
              {isPlaying && (
                <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
              )}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="bg-card/50 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl">
             <div className="flex items-center gap-4 mb-2">
               <Volume2 className="w-5 h-5 text-muted-foreground" />
               <span className="text-sm font-medium text-muted-foreground">Volume</span>
             </div>
             <Slider
               defaultValue={[0.5]}
               max={1}
               step={0.01}
               value={[volume]}
               onValueChange={(vals) => setVolume(vals[0])}
               className="cursor-pointer"
             />
          </div>
        </div>
      </main>
      
      <footer className="absolute bottom-6 text-center text-xs text-muted-foreground/50">
        <p>Works in background when screen is locked</p>
      </footer>
    </div>
  );
}
