DO $$
BEGIN
  IF to_regclass('public.content_translations') IS NOT NULL THEN
    ALTER TABLE public.content_translations DROP CONSTRAINT IF EXISTS content_translations_language_check;
    ALTER TABLE public.content_translations ADD CONSTRAINT content_translations_language_check CHECK (language IN ('ar', 'ha', 'fr', 'es', 'tr', 'de', 'ur', 'zh'));
  END IF;
  IF to_regclass('public.content_entries') IS NOT NULL THEN
    ALTER TABLE public.content_entries DROP CONSTRAINT IF EXISTS content_entries_language_check;
    ALTER TABLE public.content_entries ADD CONSTRAINT content_entries_language_check CHECK (language IN ('en', 'ar', 'ha', 'fr', 'es', 'tr', 'de', 'ur', 'zh'));
  END IF;
  IF to_regclass('public.site_settings') IS NOT NULL THEN
    ALTER TABLE public.site_settings DROP CONSTRAINT IF EXISTS site_settings_default_language_check;
    ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_default_language_check CHECK (default_language IN ('en', 'ar', 'ha', 'fr', 'es', 'tr', 'de', 'ur', 'zh'));
  END IF;
  IF to_regclass('public.profiles') IS NOT NULL THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_preferred_language_check CHECK (preferred_language IN ('en', 'ar', 'ha', 'fr', 'es', 'tr', 'de', 'ur', 'zh'));
  END IF;
END $$;