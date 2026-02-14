import React from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col items-center justify-center gap-4 bg-muted/30">
      <div className="relative flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
        <div className="absolute h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-lg font-semibold text-foreground/80">Loading Panel...</h3>
        <p className="text-sm text-muted-foreground animate-pulse">Switching views</p>
      </div>
    </div>
  );
}
