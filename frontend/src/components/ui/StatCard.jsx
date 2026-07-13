const StatCard = ({ title, value, icon: Icon, iconBg, change, changeLabel }) => {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-text-secondary text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
        {change !== undefined && (
          <p className="text-xs mt-2">
            <span className={change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
            <span className="text-text-muted ml-1">{changeLabel}</span>
          </p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

export default StatCard;