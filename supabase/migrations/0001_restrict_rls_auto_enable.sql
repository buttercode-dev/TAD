-- Reserved infrastructure hardening. The event-trigger helper must never be callable through the Data API.
revoke all on function public.rls_auto_enable() from public;
revoke all on function public.rls_auto_enable() from anon;
revoke all on function public.rls_auto_enable() from authenticated;
grant execute on function public.rls_auto_enable() to service_role;
