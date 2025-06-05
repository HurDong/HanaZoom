"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimateOnScrollProps {
  children: React.ReactNode
  className?: string
  animation: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in" | "zoom-out" | "flip-up" | "flip-down"
  duration?: number
  delay?: number
  threshold?: number
  once?: boolean
}

export function AnimateOnScroll({
  children,
  className,
  animation,
  duration = 800,
  delay = 0,
  threshold = 0.1,
  once = true,
}: AnimateOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once && ref.current) {
            observer.unobserve(ref.current)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold },
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [once, threshold])

  const animationClasses = {
    "fade-up": "translate-y-10 opacity-0",
    "fade-down": "translate-y-[-10px] opacity-0",
    "fade-left": "translate-x-[-10px] opacity-0",
    "fade-right": "translate-x-10 opacity-0",
    "zoom-in": "scale-95 opacity-0",
    "zoom-out": "scale-105 opacity-0",
    "flip-up": "rotateX(-10deg) opacity-0",
    "flip-down": "rotateX(10deg) opacity-0",
  }

  return (
    <div
      ref={ref}
      className={cn("transition-all", isVisible ? "" : animationClasses[animation], className)}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
