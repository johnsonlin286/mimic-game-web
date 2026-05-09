"use client";

import { useEffect } from "react";

import { useToastStore } from "@/store/toast-state";

export default function Toast() {
  const { message, type, show, hideToast } = useToastStore();

  const typeClasses = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-baby-blue",
  }[type];

  useEffect(() => {
    if (show) {
      setTimeout(() => {
        hideToast();
      }, 3000);
    }
  }, [show, hideToast]);
  

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${typeClasses} rounded-lg p-4 shadow-lg`}>
        <p className="text-white text-sm">
          {message}
        </p>
      </div>
    </div>
  )
}