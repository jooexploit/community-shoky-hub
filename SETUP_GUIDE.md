# Step-by-Step Setup Guide for New Shoky Community Hub Project

## Step 1: Create New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project name: "shoky-community-hub"
5. Generate a strong database password
6. Select your region
7. Click "Create new project"
8. Wait for the project to be ready

## Step 2: Get Your Project Credentials

1. Go to Project Settings → API
2. Copy these values:
   - Project URL
   - Project API Key (anon, public)
   - Service Role Key (keep this secret!)

## Step 3: Update Your .env File

Replace the content of your `.env` file with:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Run the Database Migration

1. In your Supabase Dashboard, go to SQL Editor
2. Copy the entire content of `complete_setup.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the migration
5. You should see success messages in the results

## Step 5: Create Auth Users

You need to create users in Supabase Auth for each test account:

1. Go to Authentication → Users in your Supabase Dashboard
2. Click "Add user" for each of these:

### Super Admin User

- Email: `admin@shoky.com`
- Password: `Admin123!@#`
- Email Confirmed: ✓ (check this box)

### HR Admin User

- Email: `hr@shoky.com`
- Password: `HR123!@#`
- Email Confirmed: ✓

### Social Media Admin User

- Email: `social@shoky.com`
- Password: `Social123!@#`
- Email Confirmed: ✓

### Developer Users

- Email: `dev1@shoky.com`
- Password: `Dev123!@#`
- Email Confirmed: ✓

- Email: `dev2@shoky.com`
- Password: `Dev123!@#`
- Email Confirmed: ✓

## Step 6: Update User UUIDs (IMPORTANT!)

After creating the auth users, you need to update the UUIDs in the database:

1. In Authentication → Users, copy the UUID for each user
2. Go to SQL Editor
3. Run this query to update the UUIDs (replace the UUIDs with the real ones):

```sql
-- Update user UUIDs with real auth.users IDs
UPDATE users SET id = 'REAL_UUID_FOR_ADMIN' WHERE email = 'admin@shoky.com';
UPDATE users SET id = 'REAL_UUID_FOR_HR' WHERE email = 'hr@shoky.com';
UPDATE users SET id = 'REAL_UUID_FOR_SOCIAL' WHERE email = 'social@shoky.com';
UPDATE users SET id = 'REAL_UUID_FOR_DEV1' WHERE email = 'dev1@shoky.com';
UPDATE users SET id = 'REAL_UUID_FOR_DEV2' WHERE email = 'dev2@shoky.com';

-- Also update the foreign key references in other tables
UPDATE tasks SET assigned_to = 'REAL_UUID_FOR_DEV1' WHERE assigned_to = '44444444-4444-4444-4444-444444444444';
UPDATE tasks SET assigned_to = 'REAL_UUID_FOR_DEV2' WHERE assigned_to = '55555555-5555-5555-5555-555555555555';
UPDATE tasks SET assigned_to = 'REAL_UUID_FOR_HR' WHERE assigned_to = '22222222-2222-2222-2222-222222222222';
UPDATE tasks SET assigned_to = 'REAL_UUID_FOR_SOCIAL' WHERE assigned_to = '33333333-3333-3333-3333-333333333333';

UPDATE tasks SET created_by = 'REAL_UUID_FOR_ADMIN' WHERE created_by = '11111111-1111-1111-1111-111111111111';
UPDATE tasks SET created_by = 'REAL_UUID_FOR_DEV1' WHERE created_by = '44444444-4444-4444-4444-444444444444';

UPDATE content_plans SET created_by = 'REAL_UUID_FOR_SOCIAL' WHERE created_by = '33333333-3333-3333-3333-333333333333';
UPDATE content_plans SET approved_by = 'REAL_UUID_FOR_ADMIN' WHERE approved_by = '11111111-1111-1111-1111-111111111111';

UPDATE activity_logs SET user_id = 'REAL_UUID_FOR_ADMIN' WHERE user_id = '11111111-1111-1111-1111-111111111111';
UPDATE activity_logs SET user_id = 'REAL_UUID_FOR_HR' WHERE user_id = '22222222-2222-2222-2222-222222222222';
UPDATE activity_logs SET user_id = 'REAL_UUID_FOR_SOCIAL' WHERE user_id = '33333333-3333-3333-3333-333333333333';
UPDATE activity_logs SET user_id = 'REAL_UUID_FOR_DEV1' WHERE user_id = '44444444-4444-4444-4444-444444444444';
UPDATE activity_logs SET user_id = 'REAL_UUID_FOR_DEV2' WHERE user_id = '55555555-5555-5555-5555-555555555555';
```

## Step 7: Test Your Application

1. Start your development server: `npm run dev`
2. Try logging in with each test account:
   - `admin@shoky.com` / `Admin123!@#` (should see all dashboards)
   - `hr@shoky.com` / `HR123!@#` (should see HR dashboard)
   - `social@shoky.com` / `Social123!@#` (should see Social Media dashboard)
   - `dev1@shoky.com` / `Dev123!@#` (should see Developer dashboard)
   - `dev2@shoky.com` / `Dev123!@#` (should see Developer dashboard)

## What's Included in the Sample Data:

### Users (5 total):

- 1 Super Admin (full access)
- 1 HR Admin (user management + tasks)
- 1 Social Media Admin (content management)
- 2 Developers (task management)

### Tasks (10 total):

- Development tasks (authentication, responsive design, optimization, dark mode)
- HR tasks (performance reviews, handbook updates, team building)
- Social media tasks (content calendar, templates, campaigns)

### Content Plans (8 total):

- 3 Approved posts (ready to publish)
- 2 Pending approval (waiting for review)
- 2 Draft posts (work in progress)
- 1 Rejected post (for testing workflow)

### Activity Logs (18 entries):

- User logins from different locations
- Task updates and completions
- Content creation and approval workflows
- User management activities

## Troubleshooting:

### If login fails:

1. Check that auth users are created and email confirmed
2. Verify UUIDs match between auth.users and users table
3. Check browser console for errors

### If RLS policies block access:

1. Verify the user has the correct role in the users table
2. Check that get_current_user_role() function exists
3. Make sure the user's profile exists in the users table

### If you see "missing FROM-clause" errors:

1. This means the migration ran successfully (those errors were from the old file)
2. The new migration doesn't have those issues

## Next Steps:

Once everything is working, you can:

1. Customize the sample data
2. Add more users
3. Create additional tasks and content
4. Test all the different role permissions
5. Start building additional features

Good luck with your project! 🚀
