interface ContainerProps {
  className?: string;
  children: React.ReactNode;
}

export default function Container({ children, className }: ContainerProps) {
  return (
    <main className="w-full min-h-dvh">
      <div className={`w-full h-full max-w-3xl mx-auto px-4 select-none ${className}`}>
        {children}
      </div>
    </main>
  )
}