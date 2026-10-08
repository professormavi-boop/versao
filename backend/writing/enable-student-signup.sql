-- Candidato: aplicar somente após autorização específica do banco compartilhado.
UPDATE public.system_feature_flags SET is_enabled = true WHERE feature_key = 'student_independent' AND is_enabled = false;
-- Rollback: UPDATE public.system_feature_flags SET is_enabled = false WHERE feature_key = 'student_independent';
