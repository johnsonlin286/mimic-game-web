interface ContainerProps {
  className?: string;
  children: React.ReactNode;
}

export default function Container({ children, className }: ContainerProps) {
  return (
    <main className="w-full h-dvh">
      <div className={`w-full h-full max-w-5xl mx-auto px-4 ${className}`}>
        {children}
      </div>
    </main>
  )
}