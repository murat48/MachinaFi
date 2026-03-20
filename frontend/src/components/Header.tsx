import WalletButton from "@/components/WalletButton";

export default function Header() {
  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                MachineNet
              </h1>
              <p className="text-xs text-gray-400">
                IoT Machine Economy on Stacks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-gray-300">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse-dot" />
              Testnet
            </div>
            <div className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-gray-400">
              x402 Protocol
            </div>
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
}
