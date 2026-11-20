import { useEffect } from 'react';

// The reference's blur, lift, timing, and stagger, without hiding content
// until an observer is available. Each item settles once as it enters view.
export default function useScrollReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const elements = [...document.querySelectorAll([
      '.hero-content > *', '.check-card',
      '.how-section .section-eyebrow', '.how-section h2',
      '.how-mascot-wrap', '.step-card',
      '.risks-section .section-eyebrow', '.risks-section h2',
      '.risk-card', '.privacy-card', '.footer-main', '.footer-bottom',
    ].join(', '))];
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.add('is-revealed');
        observer.unobserve(target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });

    elements.forEach((element) => {
      const siblings = [...element.parentElement.children];
      const index = siblings.filter((sibling) => elements.includes(sibling)).indexOf(element);
      element.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 90}ms`);
      element.classList.add('scroll-reveal');
      observer.observe(element);
    });
    const revealAll = () => elements.forEach((element) => element.classList.add('is-revealed'));
    const onMotionChange = () => { if (motion.matches) revealAll(); };
    // Keyboard navigation must never land in visually hidden content.
    const onFocus = (event) => event.target.closest('.scroll-reveal')?.classList.add('is-revealed');
    motion.addEventListener('change', onMotionChange);
    document.addEventListener('focusin', onFocus);
    window.addEventListener('beforeprint', revealAll);
    onMotionChange();
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', onMotionChange);
      document.removeEventListener('focusin', onFocus);
      window.removeEventListener('beforeprint', revealAll);
      elements.forEach((element) => {
        element.classList.remove('scroll-reveal', 'is-revealed');
        element.style.removeProperty('--reveal-delay');
      });
    };
  }, []);
}
