export default function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
  className = "",
}) {
  const baseClasses =
    "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary:
      "bg-dukaan-green-600 text-white hover:bg-dukaan-green-700 focus:ring-dukaan-green-500",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline:
      "border-2 border-dukaan-green-600 text-dukaan-green-600 hover:bg-dukaan-green-50 focus:ring-dukaan-green-500",
  };

  const disabledClasses = "opacity-50 cursor-not-allowed";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? disabledClasses : ""} ${className}`}
    >
      {children}
    </button>
  );
}
