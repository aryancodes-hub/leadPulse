"use client";

export default function Modal({
    show,
    onClose,
    title,
    children,
    size = "lg",
}) {
    if (!show) {
        return null;
    }

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            style={{
                backgroundColor:
                    "rgba(0, 0, 0, 0.55)",
            }}
        >
            <div
                className={`modal-dialog modal-dialog-centered modal-${size}`}
                role="document"
            >
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {title}
                        </h5>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        />
                    </div>

                    <div className="modal-body">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}