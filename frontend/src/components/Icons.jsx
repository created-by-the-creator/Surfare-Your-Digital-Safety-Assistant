export function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v9a1.5 1.5 0 0 1-1.5 1.5h-8l-5 3v-3H5A1.5 1.5 0 0 1 3.5 16V7A1.5 1.5 0 0 1 5 5.5Z" />
      <path d="M7.5 9.5h9M7.5 13h6" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m9.5 14.5 5-5" />
      <path d="M7.2 16.8 5.8 18.2a4 4 0 0 1-5.7-5.7l4-4a4 4 0 0 1 5.7 0M16.8 7.2l1.4-1.4a4 4 0 0 1 5.7 5.7l-4 4a4 4 0 0 1-5.7 0" transform="translate(1 0) scale(.92)" />
    </svg>
  );
}

export function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="9.5" r="1.5" />
      <path d="m5 17 4.5-4 3.2 2.5 2.5-2 3.8 3.5" />
    </svg>
  );
}

export function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18v2M20 20h-2" />
    </svg>
  );
}

export function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 12h17M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

export function ChevronDownIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" />
    </svg>
  );
}

export function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
      <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
    </svg>
  );
}

export function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 7.5h3l1.5-2h7l1.5 2h3A1.5 1.5 0 0 1 21.5 9v9a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </svg>
  );
}
