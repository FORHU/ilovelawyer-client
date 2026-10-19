// Re-mounts per route so each auth step rises in softly (no-op under reduced motion).
export default function AuthTemplate({ children }: { children: React.ReactNode }) {
  return <div className="motion-rise">{children}</div>;
}
