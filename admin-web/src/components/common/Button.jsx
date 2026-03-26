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
      "bg-dukaan-green-600 text-white hover:bg-dukaan-green-700 focus:ring-dukaan-green-500 dark:bg-dukaan-green-700 dark:hover:bg-dukaan-green-600",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600",
    outline:
      "border-2 border-dukaan-green-600 text-dukaan-green-600 hover:bg-dukaan-green-50 focus:ring-dukaan-green-500 dark:border-dukaan-green-400 dark:text-dukaan-green-400 dark:hover:bg-gray-800",
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
