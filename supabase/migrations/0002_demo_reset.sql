-- Rehearsal clean-up for the stage demo. It can only ever touch the job whose slug is 'demo', and it keeps the sample
-- candidates (their names end with "(nümunə)"), so it cannot delete a real job's applicants by mistake.
create or replace function public.app_demo_reset(p_secret text, p_job_id uuid) returns int
language plpgsql security definer set search_path = public as $$
declare removed int;
begin
  perform public.app_check(p_secret);
  if (select slug from public.jobs where id = p_job_id) is distinct from 'demo' then
    raise exception 'only the demo job can be reset';
  end if;
  delete from public.applications where job_id = p_job_id and candidate_name not like '%(nümunə)';
  get diagnostics removed = row_count;
  return removed;
end $$;
