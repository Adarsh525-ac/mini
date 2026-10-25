import React from 'react';

export const CardSkeleton = () => (
  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/30 animate-pulse">
    <div className="aspect-square w-full rounded-lg bg-zinc-800 mb-3" />
    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
    <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
  </div>
);

export const RowSkeleton = () => (
  <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-900/40 animate-pulse mb-2">
    <div className="flex items-center gap-3 flex-1">
      <div className="w-6 h-4 bg-zinc-800 rounded" />
      <div className="w-10 h-10 bg-zinc-800 rounded" />
      <div className="space-y-1.5 flex-1 max-w-xs">
        <div className="h-4 bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-800/60 rounded w-2/3" />
      </div>
    </div>
    <div className="hidden md:block w-1/4 h-3 bg-zinc-800/60 rounded" />
    <div className="w-12 h-3 bg-zinc-800 rounded" />
  </div>
);

export const PageSkeleton = () => (
  <div className="p-8 space-y-6">
    <div className="h-10 bg-zinc-800/60 rounded w-48 animate-pulse" />
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default { CardSkeleton, RowSkeleton, PageSkeleton };
