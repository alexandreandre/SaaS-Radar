-- Publication directe catalogue par défaut (sans file d'approbation)
UPDATE public.sourcing_settings
SET default_mode = 'direct',
    updated_at = now()
WHERE id = 'default';
