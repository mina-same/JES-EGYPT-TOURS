"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface TextAnimationProps {
  text: string;
  animationType: "fade" | "right" | "left" | "up" | "down" | "scale";
  semantic?: boolean;
}

const TextAnimation: React.FC<TextAnimationProps> = ({
  text,
  animationType,
  semantic = false,
}) => {
  // Initialize with the split text to ensure server-side and client-side match
  const [words, setWords] = useState<string[][]>(() => 
    text ? text.split(" ").map((word) => word.split("")) : []
  );
  const [isVisible, setIsVisible] = useState(false);
  const textRef = useRef<HTMLDivElement | null>(null);
  const semanticTextRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (text) {
      const splitWords = text.split(" ").map((word) => word.split(""));
      setWords(splitWords);
    }
  }, [text]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    const currentTextRef = semantic ? semanticTextRef.current : textRef.current;

    if (currentTextRef) {
      observer.observe(currentTextRef);
    }

    return () => {
      if (currentTextRef) {
        observer.unobserve(currentTextRef);
      }
    };
  }, [semantic]);

  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    right: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
    },
    left: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
    },
    up: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    down: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
    },
  };

  if (semantic) {
    return (
      <span
        ref={semanticTextRef}
        className="text-animation"
        style={{ display: "inline" }}
        suppressHydrationWarning
      >
        {words.map((word, wordIndex) => (
          <span
            key={wordIndex}
            style={{ display: "inline-block", whiteSpace: "pre" }}
          >
            {word.map((char, charIndex) => (
              <motion.span
                key={charIndex}
                variants={variants[animationType]}
                initial="initial"
                animate={isVisible ? "animate" : "initial"}
                transition={{
                  delay: wordIndex * 0.1 + charIndex * 0.02,
                  duration: 0.6,
                  ease: "easeOut",
                }}
                style={{ display: "inline-block" }}
              >
                {char}
              </motion.span>
            ))}
            {wordIndex !== words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    );
  }

  return (
    <div
      ref={textRef}
      role="text"
      aria-label={text}
      className="text-animation"
      suppressHydrationWarning
    >
      <div aria-hidden="true" style={{ display: "contents" }} suppressHydrationWarning>
        {words.map((word, wordIndex) => (
          <span key={wordIndex} style={{ display: "inline-flex" }}>
            {word.map((char, charIndex) => (
              <motion.div
                key={charIndex}
                variants={variants[animationType]}
                initial='initial'
                animate={isVisible ? "animate" : "initial"}
                transition={{
                  delay: wordIndex * 0.1 + charIndex * 0.02,
                  duration: 0.6,
                  ease: "easeOut",
                }}
                style={{ display: "inline-block" }}
              >
                {char}
              </motion.div>
            ))}
            {wordIndex !== words.length - 1 && (
              <span className="sr-only"> </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TextAnimation;
