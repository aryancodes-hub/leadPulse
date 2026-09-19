export default function LoadingSpinner({
    text = "Loading...",
}) {
    return (
        <div className="loading-state">
            <div
                className="spinner-border"
                role="status"
            />

            <span>{text}</span>
        </div>
    );
}