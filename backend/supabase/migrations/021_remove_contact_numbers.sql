-- Contact numbers are no longer collected or stored anywhere in EduMatch.
begin;

alter table public.users drop column if exists contact_number;

commit;
