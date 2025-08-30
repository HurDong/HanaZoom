"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={{ zIndex: 9999998 }}
      closeButton={false}
      toastOptions={{
        unstyled: false,
        closeButton: false,
        classNames: {
          toast:
            "group toast bg-gray-600 text-white border border-gray-600 rounded-lg shadow-xl px-4 py-3 min-w-[300px] max-w-[500px] backdrop-blur-sm [&>button]:hidden",
          description: "text-gray-200 text-sm mt-1",
          actionButton:
            "bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors",
          cancelButton:
            "bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors",
          success:
            "group toast !bg-green-500 !text-white !border-green-500 rounded-lg shadow-xl px-4 py-3 min-w-[300px] max-w-[500px] backdrop-blur-sm [&>button]:hidden",
          error:
            "!bg-red-700 !text-white border border-gray-400 rounded-lg shadow-xl px-4 py-3 min-w-[300px] max-w-[500px] backdrop-blur-sm [&>button]:hidden",
          warning:
            "!bg-yellow-400 !text-yellow-900 border border-gray-400 rounded-lg shadow-xl px-4 py-3 min-w-[300px] max-w-[500px] backdrop-blur-sm [&>button]:hidden",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
