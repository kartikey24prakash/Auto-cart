import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../state/ThemeProvider';

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    // Render a stable skeleton to prevent layout shift
    return (
      <div
        aria-hidden="true"
        className="flex items-center gap-0.5 p-1 rounded-full border border-border bg-muted"
        style={{ height: 32, width: 96 }}
      />
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="relative flex items-center p-[3px] rounded-full border border-border bg-muted"
      style={{ gap: 1 }}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = theme === value;
        return (
          <div key={value} className="relative">
            <motion.button
              role="radio"
              aria-checked={isActive}
              aria-label={`${label} theme`}
              onClick={() => setTheme(value)}
              onMouseEnter={() => setTooltip(value)}
              onMouseLeave={() => setTooltip(null)}
              className="relative flex items-center justify-center w-[26px] h-[26px] rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 600, damping: 30 }}
            >
              {/* Animated sliding background pill */}
              {isActive && (
                <motion.span
                  layoutId="theme-toggle-pill"
                  className="absolute inset-0 rounded-full bg-background shadow-sm"
                  style={{ border: '1px solid var(--border)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.6 }}
                  aria-hidden="true"
                />
              )}

              {/* Icon with crossfade */}
              <motion.span
                className="relative z-10 flex items-center justify-center"
                animate={{
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                  scale: isActive ? 1 : 0.85,
                }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Icon
                  style={{ width: 13, height: 13, strokeWidth: isActive ? 2.2 : 1.8 }}
                />
              </motion.span>
            </motion.button>

            {/* Floating tooltip */}
            <AnimatePresence>
              {tooltip === value && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.92 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="pointer-events-none absolute left-1/2 -bottom-7 z-50"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <div className="flex items-center whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide bg-foreground text-background shadow-md">
                    {label}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
