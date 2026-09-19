export default function DashboardCard({
    title,
    value,
    description,
    icon,
    trend,
}) {
    return (
        <div className="dashboard-card">
            <div className="dashboard-card-top">
                <div>
                    <p className="dashboard-card-title">
                        {title}
                    </p>

                    <h2 className="dashboard-card-value">
                        {value ?? "--"}
                    </h2>
                </div>

                {icon && (
                    <div className="dashboard-card-icon">
                        {icon}
                    </div>
                )}
            </div>

            {(description || trend) && (
                <div className="dashboard-card-bottom">
                    {description && (
                        <span>
                            {description}
                        </span>
                    )}

                    {trend && (
                        <span className="trend">
                            {trend}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}