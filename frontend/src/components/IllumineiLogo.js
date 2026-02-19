export default function IllumineiLogo({ size = 40, className = "", showText = true }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.svg"
        alt="Illuminei Logo"
        width={size}
        height={size}
        className="object-contain"
      />
      {showText && (
        <>
          <span className="text-xl font-bold text-slate-800">ILLUMINE</span>
          <span className="text-xl font-bold text-red-500">i</span>
        </>
      )}
    </div>
  );
}

