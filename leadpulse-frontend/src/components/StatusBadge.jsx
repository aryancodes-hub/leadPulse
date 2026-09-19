export default function StatusBadge({
    status,
}) {
    const normalized =
        String(status ?? "")
            .toLowerCase()
            .replace(/\s+/g, "-");

    return (
        <span
            className={`status-badge status-${normalized}`}
        >
            {status || "Unknown"}
        </span>
    );
}