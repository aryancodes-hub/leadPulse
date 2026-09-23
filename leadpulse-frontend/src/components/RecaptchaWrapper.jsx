"use client";
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

export default function RecaptchaWrapper({ children }) {
    return (
        <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "missing_key"}>
            {children}
        </GoogleReCaptchaProvider>
    );
}