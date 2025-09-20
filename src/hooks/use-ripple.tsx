
"use client";

import React, { useState, useEffect } from 'react';

export const useRipple = (ref: React.RefObject<HTMLElement>) => {
  const [ripples, setRipples] = useState<React.ReactElement[]>([]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleClick = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const left = e.clientX - rect.left;
      const top = e.clientY - rect.top;
      const height = element.clientHeight;
      const width = element.clientWidth;
      const diameter = Math.max(width, height);

      const newRipple = (
        <span
          key={e.timeStamp}
          className="ripple"
          style={{
            left: `${left - diameter / 2}px`,
            top: `${top - diameter / 2}px`,
            width: `${diameter}px`,
            height: `${diameter}px`,
          }}
        />
      );

      setRipples((prev) => [...prev, newRipple]);
    };

    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('click', handleClick);
    };
  }, [ref]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (ripples.length > 0) {
        setRipples([]);
      }
    }, 600); // Match animation duration

    return () => clearTimeout(timeout);
  }, [ripples]);

  return ripples;
};
