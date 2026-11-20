import { useEffect } from 'react';

const CONTROL = 'button, a[href], summary, label.upload-button, input[type="checkbox"], input[type="radio"]';

// Delegation includes dynamically mounted menus and portal dialogs. Animate the
// independent scale property so existing layout transforms keep working.
export default function useFluidMotion() {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Map();
    const pointers = new Map();
    const keys = new Map();
    const targetFor = (event) => {
      const element = event.target instanceof Element ? event.target.closest(CONTROL) : null;
      return element && !element.matches(':disabled, [aria-disabled="true"]') ? element : null;
    };
    const animate = (element, pressed) => {
      if (!element) return;
      if (preference.matches || !element.isConnected || !element.animate) {
        animations.get(element)?.cancel();
        animations.delete(element);
        return;
      }
      const start = getComputedStyle(element).scale;
      animations.get(element)?.cancel();
      const wide = element.getBoundingClientRect().width > 320;
      const rest = element.matches(':hover') && window.matchMedia('(hover: hover)').matches ? '1.018' : '1';
      const frames = pressed ? [
        { scale: start === 'none' ? '1' : start, filter: 'blur(0px)' },
        { scale: wide ? '.985' : '.95', filter: 'blur(.45px)' },
      ] : [
        { scale: start === 'none' ? '.96' : start, filter: 'blur(.45px)', offset: 0 },
        { scale: wide ? '1.025' : '1.055', filter: 'blur(.7px)', offset: .34 },
        { scale: '.992', filter: 'blur(0px)', offset: .62 },
        { scale: '1.008', filter: 'blur(0px)', offset: .82 },
        { scale: rest, filter: 'blur(0px)', offset: 1 },
      ];
      const animation = element.animate(frames, {
        duration: pressed ? 110 : 460,
        easing: pressed ? 'ease-out' : 'cubic-bezier(.22, .7, .3, 1)',
        fill: pressed ? 'forwards' : 'none',
      });
      animations.set(element, animation);
      animation.onfinish = () => {
        if (!pressed && animations.get(element) === animation) animations.delete(element);
      };
    };
    const down = (event) => {
      if (event.button !== 0) return;
      const target = targetFor(event);
      if (!target) return;
      pointers.set(event.pointerId, target);
      animate(target, true);
    };
    const up = (event) => {
      const target = pointers.get(event.pointerId);
      if (!target) return;
      pointers.delete(event.pointerId);
      animate(target, false);
    };
    const keyDown = (event) => {
      if (event.repeat || !['Enter', ' '].includes(event.key)) return;
      const target = targetFor(event);
      if (!target || event.target !== target) return;
      keys.set(event.key, target);
      animate(target, true);
    };
    const keyUp = (event) => {
      const target = keys.get(event.key);
      if (!target) return;
      keys.delete(event.key);
      animate(target, false);
    };
    const reset = () => {
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      pointers.clear();
      keys.clear();
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointerup', up, true);
    document.addEventListener('pointercancel', up, true);
    document.addEventListener('keydown', keyDown, true);
    document.addEventListener('keyup', keyUp, true);
    window.addEventListener('blur', reset);
    preference.addEventListener('change', reset);
    return () => {
      reset();
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', up, true);
      document.removeEventListener('keydown', keyDown, true);
      document.removeEventListener('keyup', keyUp, true);
      window.removeEventListener('blur', reset);
      preference.removeEventListener('change', reset);
    };
  }, []);
}
