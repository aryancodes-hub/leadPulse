import Link from "next/link";

export default function NotFoundPage() {
    return (
        <main className="error-page">
            <div className="error-card">
                <div className="error-code"> ERROR 404 </div>
                <h1> Page not found </h1>
                <p> The page you are looking for doesn't exist or has been moved. Check the URL or head back to safety. </p>
                <Link href="/" className="btn btn-primary" > Return home </Link>
            </div>
        </main>
    );
}
