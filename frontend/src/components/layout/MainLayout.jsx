import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Player from '../player/Player';

const MainLayout = () => {
  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden select-none">
      {/* Top Application Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Main Scrollable Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-zinc-900 rounded-lg m-2 mr-2 mb-0 overflow-hidden border border-zinc-800/40">
          <Topbar />
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Fixed Bottom Player */}
      <Player />
    </div>
  );
};

export default MainLayout;
