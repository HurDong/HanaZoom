"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FloatingWriteButtonProps {
  onClick: () => void;
  isLoggedIn: boolean;
}

export function FloatingWriteButton({ onClick, isLoggedIn }: FloatingWriteButtonProps) {
  if (!isLoggedIn) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={onClick}
        size="lg"
        className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
      >
        <span className="text-2xl">✍️</span>
      </Button>
      
      {/* 툴팁 */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm px-3 py-1 rounded-lg whitespace-nowrap">
          새 글 작성
        </div>
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
      </div>
    </div>
  );
}