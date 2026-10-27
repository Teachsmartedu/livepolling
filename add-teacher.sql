-- Replace the example with the teacher's actual email, then run in Supabase SQL Editor.
-- Also create that same user in Supabase Authentication > Users > Add user > Create new user.
INSERT INTO teachsmart.teacher_access(email)
VALUES (lower(trim('YOUR-TEACHER-EMAIL@example.com')))
ON CONFLICT (email) DO NOTHING;
