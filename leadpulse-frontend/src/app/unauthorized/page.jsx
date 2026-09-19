// import Link from "next/link";

// export default function UnauthorizedPage() {
//     return (
//         <main className="error-page">
//             <div className="error-card">
//                 <div className="error-code"> ERROR 403 </div>
//                 <h1> Access denied </h1>
//                 <p> You don't have permission to view this workspace. Switch accounts or head back to a page you can access. </p>
//                 <Link href="/" className="btn btn-primary" > Return home </Link>
//             </div>
//         </main>
//     );
// }


import Image from "next/image";
import Link from "next/link";

export default function UnauthorizedPage() {
    return (
        <main className="error-page">
            <div className="error-page-aurora">
                <div className="error-blob" />
            </div>
            <div className="error-card">
                {/* <Image src="/unauthorized.png" alt="" width={84} height={84} className="error-icon" /> */}
                <div className="error-code"> ERROR 403 </div>
                <h1> Access denied </h1>
                <p> You don't have permission to view this workspace. Switch accounts or head back to a page you can access. </p>
                <Link href="/" className="btn btn-primary"> Return home </Link>
            </div>
        </main>
    );
}