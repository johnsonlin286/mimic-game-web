"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Roboto } from "next/font/google";
import { Loader2 } from "lucide-react";

import Image from "next/image";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

interface GoogleLoginBtnProps {
  className?: string;
}

export default function GoogleLoginBtn({ className }: GoogleLoginBtnProps) {
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [status]);

  const buttonStyles = `${roboto.className} flex justify-center items-center gap-2.5 bg-white text-[#1F1F1F] text-sm font-medium px-3 py-2.5 rounded-full cursor-pointer hover:bg-[#F2F2F2] ${className}`;

  if (loading) {
    return (
      <Loader2 className="w-8 h-8 animate-spin text-mint" />
    );
  }

  if (session) {
    return (
      <button onClick={() => signOut()} disabled={loading} className={buttonStyles}>
        <Image src={session.user!.image!} alt="Google" width={20} height={20} className="rounded-full" />
        Sign out
      </button>
    );
  }

  return (
    <button onClick={() => signIn("google")} disabled={loading} className={buttonStyles}>
      <Image src="/images/g-logo.webp" alt="Google" width={20} height={20} />
      Sign in with Google
    </button>
  );
}