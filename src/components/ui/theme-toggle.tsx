"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = React.useCallback(() => {
    // Ensure we only toggle between light and dark (no system)
    const currentTheme = resolvedTheme || theme
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'

    console.log('Theme toggle clicked:', { 
      currentTheme, 
      newTheme, 
      theme, 
      resolvedTheme 
    })
    
    // Set the new theme
    setTheme(newTheme)
  }, [theme, resolvedTheme, setTheme])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="relative z-[100] pointer-events-auto"
        aria-label="Toggle theme"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark' || theme === 'dark'

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative z-[100] pointer-events-auto overflow-hidden group theme-toggle-glow border-2 hover:border-primary/50 hover:scale-105 transition-all duration-300"
      style={{ cursor: 'pointer' }}
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
    >
      {/* Animated background pulse */}
      <motion.div
        className="absolute inset-0 rounded-md opacity-20 pointer-events-none"
        animate={{
          background: isDark
            ? ['rgba(59, 130, 246, 0)', 'rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0)']
            : ['rgba(245, 158, 11, 0)', 'rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0)'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Sun Icon */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={false}
        animate={{
          scale: isDark ? 0 : 1,
          rotate: isDark ? -180 : 0,
          opacity: isDark ? 0 : 1,
        }}
        transition={{
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <motion.div
          whileHover={{
            rotate: 360,
            scale: 1.3,
            filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))",
          }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
            rotate: {
              type: "spring",
              stiffness: 200,
              damping: 15
            }
          }}
          className="sun-glow pointer-events-none"
        >
          <motion.div
            animate={{
              rotateY: [0, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500 group-hover:text-amber-300 drop-shadow-sm pointer-events-none" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Moon Icon */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={false}
        animate={{
          scale: isDark ? 1 : 0,
          rotate: isDark ? 0 : 180,
          opacity: isDark ? 1 : 0,
        }}
        transition={{
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <motion.div
          whileHover={{
            rotate: -45,
            scale: 1.3,
            y: -3,
            filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))",
          }}
          transition={{
            duration: 0.6,
            ease: "easeInOut",
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          className="moon-glow pointer-events-none"
        >
          <motion.div
            animate={{
              rotateZ: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Moon className="h-[1.2rem] w-[1.2rem] text-blue-400 group-hover:text-blue-200 drop-shadow-sm pointer-events-none" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Sparkle effects for transitions */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute w-1 h-1 bg-current rounded-full pointer-events-none"
            style={{
              left: `${20 + i * 10}%`,
              top: `${20 + (i % 2) * 60}%`,
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 0.8, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>

      <span className="sr-only">
        {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      </span>
    </Button>
  )
}
