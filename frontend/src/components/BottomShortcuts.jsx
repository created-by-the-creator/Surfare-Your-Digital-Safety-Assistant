import { useEffect, useState } from 'react';
import { Bot, House, MessageSquareText, ScanLine, ShieldCheck } from 'lucide-react';
import './BottomShortcuts.css';

export default function BottomShortcuts({ t, onOpenSurfy, onOpenFeedback, isModalOpen }) {
  const [active, setActive] = useState('home');

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const point = window.innerHeight * .38;
      const top = (selector) => document.querySelector(selector)?.getBoundingClientRect().top ?? Infinity;
      const heroBottom = document.querySelector('.hero')?.getBoundingClientRect().bottom ?? 0;
      const ask = document.querySelector('.ask-panel-position')?.getBoundingClientRect();
      if (heroBottom > point) setActive('home');
      else if (top('#how-it-works') <= point || top('#risk-levels') <= point) setActive('hub');
      else if (ask && ask.top < innerHeight * .65 && ask.bottom > point) setActive('surfy');
      else setActive('scan');
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  const items = [
    { key: 'home', Icon: House, href: '#top' },
    { key: 'scan', Icon: ScanLine, href: '#check' },
    { key: 'surfy', Icon: Bot, action: onOpenSurfy },
    { key: 'hub', Icon: ShieldCheck, href: '#risk-levels' },
    { key: 'feedback', Icon: MessageSquareText, action: onOpenFeedback },
  ];

  return (
    <>
      <nav className={`bottom-shortcuts${isModalOpen ? ' is-obscured' : ''}`} aria-label={t('shortcuts.label')} aria-hidden={isModalOpen || undefined}>
        {items.map(({ key, Icon, href, action }) => {
          const content = <><Icon aria-hidden="true" /><span>{t(`shortcuts.${key}`)}</span></>;
          const className = `shortcut-item${active === key ? ' is-active' : ''}`;
          return href ? (
            <a key={key} className={className} href={href} aria-current={active === key ? 'location' : undefined}
              tabIndex={isModalOpen ? -1 : undefined} onClick={() => setActive(key)}>{content}</a>
          ) : (
            <button key={key} className={className} type="button" tabIndex={isModalOpen ? -1 : undefined}
              aria-current={active === key ? 'location' : undefined}
              onClick={() => { setActive(key); action(); }}>{content}</button>
          );
        })}
      </nav>
      <div className="shortcut-end-space" aria-hidden="true" />
    </>
  );
}
