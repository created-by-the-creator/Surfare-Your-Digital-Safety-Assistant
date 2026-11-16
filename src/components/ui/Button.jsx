// Shared button styles keep actions consistent throughout the app.
export default function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`button button-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}
