import Image from "next/image";

export const HeroHeader = () => {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-black text-white shadow-2xl">
      <div className="absolute inset-0 opacity-40">
        <Image
          src="/assets/aurora.svg"
          alt="Aurora gradient"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="relative z-10 flex flex-col gap-6 p-10">
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-200/80">
          Battle Farm Saga
        </p>
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          React-powered text RPG defending your farm across endless waves.
        </h1>
        <p className="max-w-2xl text-base text-emerald-100/90">
          Type commands, trigger skills, and watch combat logs animate in real-time. Saves
          sync locally and can later be backed up via Supabase.
        </p>
      </div>
    </header>
  );
};
