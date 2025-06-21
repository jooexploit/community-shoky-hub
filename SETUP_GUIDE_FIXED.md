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

## Step 4: Run the Database Schema

1. In your Supabase Dashboard, go to SQL Editor
2. Copy the entire content of `schema_only.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema creation
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

## Step 6: Sign In Each User Once

**IMPORTANT:** Each user needs to sign in at least once to create their profile in the users table.

1. Start your development server: `npm run dev`
2. Sign in with each account one by one:

   - `admin@shoky.com` / `Admin123!@#`
   - `hr@shoky.com` / `HR123!@#`
   - `social@shoky.com` / `Social123!@#`
   - `dev1@shoky.com` / `Dev123!@#`
   - `dev2@shoky.com` / `Dev123!@#`

3. When signing in, you'll need to set the correct role for each user. You can do this by updating their profile in the users table or by having your super admin do it through the app.

## Step 7: Set User Roles

After all users have signed in, go back to SQL Editor and run this to set the correct roles:

```sql
-- Update user roles based on their email
UPDATE users SET role = 'super_admin' WHERE email = 'admin@shoky.com';
UPDATE users SET role = 'hr_admin' WHERE email = 'hr@shoky.com';
UPDATE users SET role = 'social_media_admin' WHERE email = 'social@shoky.com';
UPDATE users SET role = 'developer' WHERE email IN ('dev1@shoky.com', 'dev2@shoky.com');

-- Verify the roles are set correctly
SELECT email, role FROM users ORDER BY role, email;
```

## Step 8: Add Sample Data

1. In your Supabase Dashboard, go to SQL Editor
2. Copy the entire content of `sample_data.sql`
3. Paste it into the SQL Editor
4. Click "Run" to add sample tasks, content plans, and activity logs
5. You should see messages showing what data was added

## Step 9: Test Your Application

Now you can test your application with all the sample data:

1. Sign in with each test account to verify role-based access:
   - `admin@shoky.com` / `Admin123!@#` (should see all dashboards and data)
   - `hr@shoky.com` / `HR123!@#` (should see HR dashboard and user management)
   - `social@shoky.com` / `Social123!@#` (should see Social Media dashboard and content)
   - `dev1@shoky.com` / `Dev123!@#` (should see Developer dashboard and assigned tasks)
   - `dev2@shoky.com` / `Dev123!@#` (should see Developer dashboard and assigned tasks)

## What's Included in the Sample Data:

### Users (5 total):

- 1 Super Admin (full access to everything)
- 1 HR Admin (user management + tasks)
- 1 Social Media Admin (content management + social tasks)
- 2 Developers (assigned tasks only)

### Tasks (10 total):

- Development tasks (authentication, responsive design, optimization, dark mode)
- HR tasks (performance reviews, handbook updates, team building)
- Social media tasks (content calendar, templates, campaigns)

### Content Plans (6 total):

- 2 Approved posts (ready to publish)
- 2 Pending approval (waiting for review)
- 1 Draft post (work in progress)
- 1 Rejected post (for testing workflow)

### Activity Logs (10+ entries):

- User logins from different locations
- Task updates and completions
- Content creation and approval workflows
- User management activities

## Troubleshooting:

### If login fails:

1. Check that auth users are created and email confirmed
2. Verify each user has signed in at least once
3. Check browser console for errors

### If RLS policies block access:

1. Verify the user has the correct role in the users table
2. Check that get_current_user_role() function exists
3. Make sure the user's profile exists in the users table

### If sample data script fails:

1. Make sure all users have signed in at least once
2. Check that user profiles exist in the users table
3. Run the role update script in Step 7

### If you see role-related issues:

1. Run the role verification query from Step 7
2. Make sure each user has the correct role assigned
3. Sign out and sign back in to refresh the session

## Key Files:

- `schema_only.sql` - Creates the database schema without data
- `sample_data.sql` - Adds realistic sample data using real user IDs
- `SETUP_GUIDE.md` - This file with complete instructions

This approach avoids the foreign key constraint issues by creating users properly through the auth system first, then adding sample data that references real user IDs.

Good luck with your project! 🚀
