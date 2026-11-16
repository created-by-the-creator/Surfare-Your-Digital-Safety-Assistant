// Small label used for detected signals and privacy notes.
export default function Chip({ children, className = '' }) {
  return <span className={`chip ${className}`.trim()}>{children}</span>
}
