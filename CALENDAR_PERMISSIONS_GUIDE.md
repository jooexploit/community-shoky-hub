# Calendar Role-Based Permissions Guide

## 📋 **Role-Based Calendar Visibility**

### **🔵 Super Admin (`super_admin`)**

- ✅ **Content Events**: Can see ALL scheduled content from content_plans
- ✅ **Task Events**: Can see ALL task due dates from tasks
- ✅ **Calendar Events**: Can see ALL user-created events/meetings/deadlines
- ✅ **Edit Rights**: Can edit and delete ANY calendar event (own + others)
- ✅ **Create**: Can create new calendar events

### **🟠 HR Admin (`hr_admin`)**

- ❌ **Content Events**: Cannot see content (not their role)
- ✅ **Task Events**: Can see ALL task due dates from tasks
- ✅ **Calendar Events**: Can see ALL user-created events/meetings/deadlines
- ✅ **Edit Rights**: Can edit and delete ANY calendar event (own + others)
- ✅ **Create**: Can create new calendar events

### **🟣 Social Media Admin (`social_media_admin`)**

- ✅ **Content Events**: Can see scheduled content they created or all content
- ❌ **Task Events**: Can only see tasks assigned to them (limited)
- ✅ **Calendar Events**: Can see ALL user-created events/meetings/deadlines
- ⚠️ **Edit Rights**: Can only edit and delete their OWN calendar events
- ✅ **Create**: Can create new calendar events

### **🟢 Developer (`developer`)**

- ❌ **Content Events**: Cannot see content (not their role)
- ⚠️ **Task Events**: Can only see tasks assigned to them
- ✅ **Calendar Events**: Can see ALL user-created events/meetings/deadlines
- ⚠️ **Edit Rights**: Can only edit and delete their OWN calendar events
- ✅ **Create**: Can create new calendar events

---

## 🎨 **Calendar Event Types & Colors**

| Event Type       | Color              | Source                  | Who Can See                         |
| ---------------- | ------------------ | ----------------------- | ----------------------------------- |
| 📱 **Content**   | Purple (`#8B5CF6`) | `content_plans` table   | `super_admin`, `social_media_admin` |
| ✅ **Tasks**     | Amber (`#F59E0B`)  | `tasks` table           | Role-based (see above)              |
| 👥 **Meetings**  | Blue (`#3B82F6`)   | `calendar_events` table | Everyone                            |
| 📅 **Events**    | Green (`#10B981`)  | `calendar_events` table | Everyone                            |
| ⏰ **Deadlines** | Red (`#EF4444`)    | `calendar_events` table | Everyone                            |

---

## 🔧 **Technical Implementation**

### **Database Policies (RLS)**

```sql
-- Content Plans: Only super_admin and social_media_admin
CREATE POLICY "Users can read relevant content" ON content_plans FOR SELECT
USING (created_by = auth.uid() OR get_current_user_role() IN ('super_admin', 'social_media_admin'));

-- Tasks: Role-based access
CREATE POLICY "Users can read relevant tasks" ON tasks FOR SELECT
USING (assigned_to = auth.uid() OR created_by = auth.uid() OR get_current_user_role() IN ('super_admin', 'hr_admin'));

-- Calendar Events: Everyone can view, limited edit
CREATE POLICY "Users can view all calendar events" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "Users can update calendar events" ON calendar_events FOR UPDATE
USING (auth.uid() = created_by OR get_current_user_role() IN ('super_admin', 'hr_admin'));
```

### **Frontend Logic**

- **Content Query**: Only executed for `super_admin` and `social_media_admin`
- **Task Query**: Full access for `super_admin`/`hr_admin`, filtered for others
- **Edit UI**: Shows edit/delete buttons based on role permissions
- **Event Creation**: Available to all authenticated users

---

## 🚨 **Security Notes**

1. **Row Level Security (RLS)** is enabled on all tables
2. **Role-based filtering** happens at the database level
3. **Frontend checks** provide UI enhancement but security is server-side
4. **Activity logging** tracks all calendar operations for audit trails

---

## 📱 **User Experience**

### **What Social Media Admin Sees:**

- Their scheduled content posts (purple events)
- Tasks assigned to them (amber events)
- All team meetings/events/deadlines (blue/green/red)
- Can edit only their own calendar events

### **What HR Admin Sees:**

- All task due dates (amber events)
- All team meetings/events/deadlines (blue/green/red)
- Can edit any calendar event (management privileges)
- No content events (not their domain)

### **What Developers See:**

- Only tasks assigned to them (amber events)
- All team meetings/events/deadlines (blue/green/red)
- Can edit only their own calendar events
- No content events (not their domain)

This role-based system ensures each user sees relevant information while maintaining proper access controls and management capabilities for administrative roles.
