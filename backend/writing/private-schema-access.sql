-- Internal backend role needs namespace access to existing granted helpers.
-- Do not expose private in the Data API or grant access to client roles.
GRANT USAGE ON SCHEMA private TO service_role;
