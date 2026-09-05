-- 0026_platform_control.sql
-- Admin-managed provider selection and notification templates.
-- Secrets/API keys must remain in deployment environment variables, not in app_config.
insert into public.app_config(key,value) values
('integrations','{"registrar":{"provider":"","enabled":false},"payments":{"provider":"","enabled":false},"email":{"provider":"","enabled":false},"storage":{"provider":"","enabled":false}}'::jsonb),
('notification_templates','{"order_paid":{"subject":"Your SITES.BD order is confirmed","body":"Your payment has been received."},"domain_expiry":{"subject":"Your domain is expiring soon","body":"Your domain needs attention."},"invoice_created":{"subject":"New SITES.BD invoice","body":"A new invoice is available."},"ticket_reply":{"subject":"New support reply","body":"Your support ticket has a new reply."}}'::jsonb)
on conflict (key) do nothing;
