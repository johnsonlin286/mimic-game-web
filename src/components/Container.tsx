export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full h-dvh">
      <div className="w-full h-full max-w-5xl mx-auto px-4">
        {children}
      </div>
    </main>
  )
}