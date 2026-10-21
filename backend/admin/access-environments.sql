-- Candidate SQL, not applied. Preserve the original events and Auth trigger.
BEGIN;
CREATE TABLE public.platform_access_environments (
 session_id uuid PRIMARY KEY REFERENCES public.platform_access_events(session_id),
 environment text NOT NULL CHECK(environment IN ('production','homologation')),
 observed_origin text NOT NULL,
 observed_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((environment='production' AND observed_origin IN ('https://app.versaoprofessor.com','https://suaversao.vercel.app')) OR
        (environment='homologation' AND observed_origin='https://teste.versaoprofessor.com'))
);
ALTER TABLE public.platform_access_environments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_access_environments FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.platform_access_environments TO service_role;
UPDATE public.system_feature_flags SET config=coalesce(config,'{}'::jsonb)||jsonb_build_object('environment_started_at',clock_timestamp())
 WHERE feature_key='platform_access_tracking';
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.system_feature_flags WHERE feature_key='platform_access_tracking' AND config->>'environment_started_at' IS NOT NULL) THEN RAISE EXCEPTION 'Missing access tracking configuration'; END IF; END $$;
-- DEFINER is necessary to read auth.sessions without granting broad Auth access.
-- Only the trusted Edge backend can execute; actor/session come from verified JWT.
CREATE FUNCTION public.attribute_platform_access(p_actor uuid,p_session uuid,p_origin text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE env text; cutoff timestamptz; inserted integer;
BEGIN
 env:=CASE p_origin WHEN 'https://app.versaoprofessor.com' THEN 'production' WHEN 'https://suaversao.vercel.app' THEN 'production' WHEN 'https://teste.versaoprofessor.com' THEN 'homologation' ELSE NULL END;
 IF env IS NULL THEN RETURN false; END IF;
 SELECT (config->>'environment_started_at')::timestamptz INTO cutoff FROM public.system_feature_flags WHERE feature_key='platform_access_tracking';
 IF cutoff IS NULL THEN RETURN false; END IF;
 INSERT INTO public.platform_access_environments(session_id,environment,observed_origin)
 SELECT e.session_id,env,p_origin FROM public.platform_access_events e
 JOIN auth.sessions s ON s.id=e.session_id AND s.user_id=e.profile_id
 WHERE e.session_id=p_session AND e.profile_id=p_actor
 AND s.created_at>=cutoff AND e.created_at>=cutoff
 AND s.created_at>=now()-interval '5 minutes' AND s.created_at<=now()
 AND (s.not_after IS NULL OR s.not_after>now())
 ON CONFLICT(session_id) DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 RETURN inserted=1;
END $$;
REVOKE ALL ON FUNCTION public.attribute_platform_access(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.attribute_platform_access(uuid,uuid,text) TO service_role;
COMMIT;
