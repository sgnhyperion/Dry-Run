"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { analytics, logEvent } from "@/firebase/config";

const PageTracker: React.FC = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (analytics && pathname) {
      logEvent(analytics, "page_view", { page_path: pathname });
      console.log("[Analytics] Page viewed:", pathname);
    }
  }, [pathname]);

  return null;
};

export default PageTracker;
