export default function EmptyState({
    title = "Nothing here yet",
    description = "",
    action = null,
}) {
    return (
        <div className="empty-state">
            <div className="empty-icon"> + </div>
            <h4>{title}</h4>
            {description && (  <p>{description}</p> )}
            {action}
        </div>
    );
}