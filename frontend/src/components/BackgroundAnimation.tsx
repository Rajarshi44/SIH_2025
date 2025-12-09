"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export const BackgroundAnimation = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900/80 via-dark-900/70 to-dark-800/80">
        <div className="absolute inset-0 backdrop-blur-[120px]">
          <DotLottieReact
            src="/animations/background.lottie"
            loop
            autoplay
            className="w-full h-full opacity-20 scale-[1.8] blur-sm"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/50 via-transparent to-dark-900/30"></div>
      </div>
    </div>
  );
};
