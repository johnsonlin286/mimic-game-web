"use client";

import { Rabbit } from "lucide-react";
import GoogleLoginBtn from "./GoogleLoginBtn";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-white shadow-md py-4">
      <div className="w-full max-w-5xl flex justify-between items-center px-4 mx-auto">
        <Link href="/">
          <Rabbit className="w-10 h-10"/>
        </Link>
        <GoogleLoginBtn />
      </div>
    </nav>
  )
}