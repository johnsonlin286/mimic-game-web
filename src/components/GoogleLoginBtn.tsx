"use client";

import { UserCircle2 } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function GoogleLoginBtn() {
  const { data: session } = useSession();

  if (session) {
    return (
      <button onClick={() => signOut()} className="flex justify-center items-center gap-2.5 border border-sky-500 text-sky-500 px-4 py-2 rounded-full cursor-pointer">
        {session.user ? (
          <Image src={session.user.image!} alt="Google" width={20} height={20} className="rounded-full" />
        ) : (
          <UserCircle2 className="w-5 h-5" />
        )}
        Logout
      </button>
    );
  }

  return (
    <button onClick={() => signIn("google")} className="flex justify-center items-center gap-2.5 bg-blue-500 text-white px-4 py-2 rounded-full cursor-pointer">
      <UserCircle2 className="w-5 h-5" />
      Login with Google
    </button>
  );
}