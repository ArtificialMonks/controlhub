// src/lib/animations/sidebar-animations.ts
import { Variants } from 'framer-motion'

// Spring configuration for smooth, natural animations
export const springConfig = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  mass: 1
}

// Tween configuration for precise timing
export const tweenConfig = {
  type: "tween" as const,
  duration: 0.3,
  ease: "easeInOut" as const
}

// Sidebar width constants - optimized for responsive behavior
export const SIDEBAR_WIDTH = {
  EXPANDED: 280,    // Desktop expanded state
  COLLAPSED: 64,    // Desktop collapsed state (icons always visible)
  MOBILE: 280       // Mobile/Tablet overlay width
}

// Sidebar animation variants
export const sidebarVariants: Variants = {
  expanded: {
    width: SIDEBAR_WIDTH.EXPANDED,
    transition: springConfig
  },
  collapsed: {
    width: SIDEBAR_WIDTH.COLLAPSED,
    transition: springConfig
  },
  mobile: {
    x: 0,
    transition: springConfig
  },
  mobileHidden: {
    x: -SIDEBAR_WIDTH.MOBILE,
    transition: springConfig
  }
}

// Content area animation variants for dynamic width adjustment
export const contentVariants: Variants = {
  sidebarExpanded: {
    opacity: 1,
    transition: springConfig
  },
  sidebarCollapsed: {
    opacity: 1,
    transition: springConfig
  },
  sidebarMobile: {
    opacity: 1,
    transition: springConfig
  }
}

// Menu item animation variants
export const menuItemVariants: Variants = {
  expanded: {
    justifyContent: "flex-start",
    transition: tweenConfig
  },
  collapsed: {
    justifyContent: "center",
    transition: tweenConfig
  },
  hover: {
    scale: 1.02,
    x: 8,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.98,
    x: 4,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
}

// Text animation variants for menu labels
export const menuTextVariants: Variants = {
  expanded: {
    opacity: 1,
    display: "block",
    transition: {
      delay: 0.1,
      duration: 0.2
    }
  },
  collapsed: {
    opacity: 0,
    display: "none",
    transition: {
      duration: 0.1
    }
  }
}

// Icon animation variants
export const iconVariants: Variants = {
  expanded: {
    scale: 1,
    transition: tweenConfig
  },
  collapsed: {
    scale: 1.2,
    transition: tweenConfig
  }
}

// Backdrop overlay for mobile
export const backdropVariants: Variants = {
  visible: {
    opacity: 1,
    transition: { duration: 0.3 }
  },
  hidden: {
    opacity: 0,
    transition: { duration: 0.3 }
  }
}

// Gradient animation variants for theme transitions
export const gradientVariants: Variants = {
  light: {
    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%)",
    transition: { duration: 0.5 }
  },
  dark: {
    background: "linear-gradient(180deg, rgba(10, 11, 31, 0.95) 0%, rgba(0, 43, 255, 0.15) 100%)",
    transition: { duration: 0.5 }
  }
}

// Stagger children animations for menu items
export const staggerContainer: Variants = {
  expanded: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1
    }
  },
  collapsed: {
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1
    }
  }
}

// Individual stagger item
export const staggerItem: Variants = {
  expanded: {
    opacity: 1,
    x: 0,
    transition: springConfig
  },
  collapsed: {
    opacity: 1,
    x: 0,
    transition: springConfig
  }
}

// Keyboard shortcut handler
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b' // Ctrl/Cmd + B

// Gesture configurations
export const DRAG_CONSTRAINTS = {
  right: 0,
  left: -SIDEBAR_WIDTH.MOBILE
}

export const SWIPE_THRESHOLD = 50 // pixels
export const SWIPE_VELOCITY_THRESHOLD = 500 // pixels per second