-- Stop new attribution, retaining all recorded evidence and all original events.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.attribute_platform_access(uuid,uuid,text) FROM service_role;
COMMIT;
-- Restore admin-base-api v18 and previous frontend if required. Do not drop data.
