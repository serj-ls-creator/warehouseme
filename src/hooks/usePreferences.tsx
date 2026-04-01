import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AppCurrency = "EUR" | "UAH" | "USD";
export type AppLanguage = "uk" | "ru" | "en";

interface PreferencesContextType {
  currency: AppCurrency;
  language: AppLanguage;
  setCurrency: (currency: AppCurrency) => void;
  setLanguage: (language: AppLanguage) => void;
  locale: string;
}

const STORAGE_KEY = "warehouseme-preferences";

const getLocaleFromLanguage = (language: AppLanguage): string => {
  switch (language) {
    case "en":
      return "en-US";
    case "ru":
      return "ru-RU";
    case "uk":
    default:
      return "uk-UA";
  }
};

const PreferencesContext = createContext<PreferencesContextType>({
  currency: "EUR",
  language: "uk",
  setCurrency: () => undefined,
  setLanguage: () => undefined,
  locale: "uk-UA",
});

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<AppCurrency>("EUR");
  const [language, setLanguageState] = useState<AppLanguage>("uk");

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<{ currency: AppCurrency; language: AppLanguage }>;
      if (parsed.currency === "EUR" || parsed.currency === "UAH" || parsed.currency === "USD") {
        setCurrencyState(parsed.currency);
      }
      if (parsed.language === "uk" || parsed.language === "ru" || parsed.language === "en") {
        setLanguageState(parsed.language);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ currency, language }));
    document.documentElement.lang = language;
  }, [currency, language]);

  const value = useMemo(
    () => ({
      currency,
      language,
      setCurrency: setCurrencyState,
      setLanguage: setLanguageState,
      locale: getLocaleFromLanguage(language),
    }),
    [currency, language],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => useContext(PreferencesContext);

export const formatNumberByLocale = (value: number, locale: string) => value.toLocaleString(locale);

export const formatDateByLocale = (
  value: string | number | Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) => new Date(value).toLocaleDateString(locale, options);

export const getDateFnsLocale = async (_language: AppLanguage) => null;
