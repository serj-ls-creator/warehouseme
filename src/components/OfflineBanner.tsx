import { WifiOff, RefreshCw, Cloud } from "lucide-react";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useI18n } from "@/hooks/usePreferences";

const OfflineBanner = () => {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineQueue();
  const { t } = useI18n();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 shadow-lg">
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>{t("offline.noConnection")}</span>
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {pendingCount} {t("offline.pending")}
            </span>
          )}
        </>
      ) : (
        <>
          <Cloud className="h-4 w-4" />
          <span>
            {pendingCount} {t("offline.pending")}
          </span>
          <button
            onClick={syncNow}
            disabled={isSyncing}
            className="ml-2 flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
            {t("offline.sync")}
          </button>
        </>
      )}
    </div>
  );
};

export default OfflineBanner;
