'use client';

export function ScanTab({ profile }: { profile: any }) {
  return (
    <div className="flex flex-col h-full w-full bg-surface text-on-surface">
      <div className="p-6 border-b border-outline-variant bg-surface-container-low/50">
        <h1 className="text-2xl font-bold">Scan</h1>
      </div>
      <div className="flex-1 flex items-center justify-center text-on-surface-variant">
        <p>Scanner UI will appear here.</p>
      </div>
    </div>
  );
}
