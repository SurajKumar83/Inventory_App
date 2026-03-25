export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  color = "green",
  onClick,
}) {
  const colorClasses = {
    green: "bg-dukaan-green-50 text-dukaan-green-600",
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const bgColorClass = colorClasses[color] || colorClasses.green;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 ${
        onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2 text-4xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
        {icon && (
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-lg ${bgColorClass}`}
          >
            <span className="text-2xl">{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}
