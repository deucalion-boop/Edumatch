-- Restrict new grading-period assignments to the current three-period structure.
-- Unchanged legacy values remain updateable so older assessment records are not
-- deleted or made impossible to maintain.

create or replace function public.enforce_current_assessment_grading_periods()
returns trigger
language plpgsql
as $$
begin
  if new.grading_period in ('', '1st', '2nd', '3rd') then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.grading_period is not distinct from old.grading_period then
    return new;
  end if;

  raise exception using
    errcode = '23514',
    message = 'grading_period must be 1st, 2nd, or 3rd';
end;
$$;

drop trigger if exists assessments_grading_period_check on public.assessments;
create trigger assessments_grading_period_check
before insert or update of grading_period on public.assessments
for each row
execute function public.enforce_current_assessment_grading_periods();

