export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-6 -my-6 flex h-[calc(100vh-0px)] min-h-0 flex-col lg:h-[calc(100vh-0px)]">
      {children}
    </div>
  );
}
