export default function Loader() {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-[#050816] text-green-400">
      
      {/* Rotating Ring */}
      <div className="relative">
        <div className="w-20 h-20 border-4 border-green-400 border-dashed rounded-full animate-spin"></div>

        {/* Glow Pulse */}
        <div className="absolute inset-0 rounded-full border border-green-400 opacity-30 animate-ping"></div>
      </div>

      {/* Text */}
      <h2 className="mt-6 text-xl font-semibold tracking-wide">
        Initializing System...
      </h2>

      <p className="text-sm opacity-70 mt-2">
        Connecting sensors • Syncing data • Booting AI
      </p>
    </div>
  );
}