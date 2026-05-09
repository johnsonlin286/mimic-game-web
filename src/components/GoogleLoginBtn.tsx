"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Roboto } from "next/font/google";
import Image from "next/image";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

interface GoogleLoginBtnProps {
  className?: string;
}

export default function GoogleLoginBtn({ className }: GoogleLoginBtnProps) {
  const { data: session } = useSession();

  const buttonStyles = `${roboto.className} flex justify-center items-center gap-2.5 bg-white text-[#1F1F1F] text-sm font-medium px-3 py-2.5 rounded-full cursor-pointer hover:bg-[#F2F2F2] ${className}`;

  if (session) {
    return (
      <button onClick={() => signOut()} className={buttonStyles}>
        <Image src={session.user!.image!} alt="Google" width={20} height={20} className="rounded-full" />
        Sign out
      </button>
    );
  }

  return (
    <button onClick={() => signIn("google")} className={buttonStyles}>
      <Image src="/images/g-logo.png" alt="Google" width={20} height={20} />
      Sign in with Google
    </button>
  );
}