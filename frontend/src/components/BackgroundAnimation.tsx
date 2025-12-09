"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export const BackgroundAnimation = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <DotLottieReact
          src="/animations/background.lottie"
          loop
          autoplay
          className="w-full h-full opacity-30 scale-150 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-dark-900/40"></div>
      </div>
    </div>
  );
};
