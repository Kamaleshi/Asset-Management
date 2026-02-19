import logo from "../assets/ilogo.png";

export default function IllumineiLogo({ size = 70, className = "" }) {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logo}
        alt="Illuminei Logo"
        height={size}
        className="w-auto object-contain"
      />
    </div>
  );
}
