# Login System & Template Saving Guide

This guide explains the new login system and template saving functionality added to the Canva ID Card Editor.

## Features Added

### 1. Authentication System
- **User Registration**: Users can create accounts with email, password, full name, and role
- **User Login**: Secure login with email and password
- **User Logout**: Secure logout functionality
- **Role-based Access**: Support for different user roles (student, faculty, coordinator, admin)

### 2. Template Saving System
- **Save Templates**: Users can save their ID card designs as reusable templates
- **Template Management**: View, load, and delete saved templates
- **Public/Private Templates**: Option to make templates public for others to use
- **Template Organization**: Templates are organized by user and include metadata

## How to Use

### Getting Started
1. Navigate to `/login` or access the Canva Editor at `/canva-editor`
2. If not logged in, you'll see the login/registration form
3. Create a new account or login with existing credentials

### Saving Templates
1. Design your ID card in the Canva Editor
2. Click the "Save Template" button in the header
3. Enter a template name and optional description
4. Choose whether to make it public or private
5. Click "Save Template"

### Managing Templates
1. Click on your user profile in the header
2. Click "My Templates" to view all saved templates
3. Use the settings icon to load a template
4. Use the trash icon to delete a template

### Loading Templates
1. Open the "My Templates" dropdown from your profile
2. Click the settings icon next to any template
3. The template will be loaded with your saved design and student data

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Templates
- `POST /api/templates/save` - Save a new template
- `GET /api/templates/user` - Get user's templates
- `DELETE /api/templates/user?id={id}` - Delete a template

## Database Schema

The system uses a `user_templates` table with the following structure:
- `id`: Unique template identifier
- `user_id`: Reference to the user who created it
- `name`: Template name
- `description`: Optional template description
- `template_data`: JSON data containing the template design
- `is_public`: Whether the template is public
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Security Features

- **Authentication Required**: All template operations require user authentication
- **User Isolation**: Users can only access their own templates
- **Input Validation**: All inputs are validated on both client and server
- **Secure Storage**: Templates are stored securely in the database

## User Roles

The system supports the following user roles:
- **Student**: Basic access to create and save templates
- **Faculty**: Enhanced access for educational use
- **Coordinator**: Administrative access for managing templates
- **Admin**: Full system access

## Troubleshooting

### Common Issues
1. **Login Failed**: Check email and password, ensure account is verified
2. **Template Save Failed**: Ensure you're logged in and have a stable connection
3. **Template Load Failed**: Check if the template still exists and you have access

### Getting Help
- Check the browser console for error messages
- Ensure your database is properly set up with the latest schema
- Verify your Supabase configuration

## Future Enhancements

- Template sharing between users
- Template categories and tags
- Template versioning
- Bulk template operations
- Template import/export functionality
