"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                HanaZoom
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
