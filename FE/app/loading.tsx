import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-lg mb-4">
        <span className="text-2xl">✨</span>
      </div>
      <h1 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
        하나줌
      </h1>
      <p className="text-green-600 dark:text-green-400 mb-8">
        데이터를 불러오는 중입니다...
      </p>
      <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
    </div>
  );
}
