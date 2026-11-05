import React from 'react';

export const EDOC_LOGO_SRC = '/assets/aistudio/EDOC_logo_0303f494.jpeg';

interface EdocLogoProps {
  variant?: 'stacked' | 'horizontal' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
}

export const EdocLogo: React.FC<EdocLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
}) => {
  const iconDimensions =
    size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';

  const IconBadge = (
    <div
      className={`${iconDimensions} rounded-xl bg-[#141820] border border-cyan-400/50 shadow-[0_0_16px_rgba(34,211,238,0.22)] flex items-center justify-center relative shrink-0 overflow-hidden`}
    >
      <img
        src={EDOC_LOGO_SRC}
        alt="EDOC Logo"
        className="w-full h-full object-cover object-[50%_30%] scale-[2.5]"
      />
    </div>
  );

  if (variant === 'icon-only') {
    return IconBadge;
  }

  if (variant === 'stacked') {
    return (
      <div className="inline-flex flex-col items-center justify-center select-none w-44 h-28 rounded-2xl bg-[#141820] border border-slate-800/90 shadow-[0_12px_35px_rgba(6,182,212,0.16)] overflow-hidden">
        <img
          src={EDOC_LOGO_SRC}
          alt="EDOC Logo"
          className="w-full h-full object-cover object-center scale-[1.22]"
        />
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      {IconBadge}
      <div className="font-display font-extrabold text-xl tracking-tight leading-none whitespace-nowrap">
        <span className="text-cyan-400">ed</span>
        <span className="text-emerald-400">oc</span>
      </div>
    </div>
  );
};
