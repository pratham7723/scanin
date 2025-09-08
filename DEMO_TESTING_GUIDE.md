# Demo & Testing Guide for Login System

This guide explains how to test the new login system and use the demo accounts.

## 🎯 Demo Accounts

The system includes pre-configured demo accounts for easy testing:

| Role | Email | Password | Full Name |
|------|-------|----------|-----------|
| Student | `student@demo.com` | `demo123` | Demo Student |
| Faculty | `faculty@demo.com` | `demo123` | Demo Faculty |
| Admin | `admin@demo.com` | `demo123` | Demo Admin |

## 🚀 Quick Start

1. **Navigate to Login Page**: Go to `/login` or `/canva-editor`
2. **Use Demo Accounts**: Click on any demo account button to auto-fill credentials
3. **Login**: Click "Sign In" to access the system
4. **Explore Features**: Access the ID card designer with your role-based permissions

## 🧪 Test IDs for Automation

All interactive elements have `data-testid` attributes for automated testing:

### Navigation
- `login-tab` - Login tab button
- `register-tab` - Register tab button

### Login Form
- `login-email-input` - Email input field
- `login-password-input` - Password input field
- `toggle-password-visibility` - Password visibility toggle
- `login-submit-button` - Login submit button

### Register Form
- `register-fullname-input` - Full name input field
- `register-email-input` - Email input field
- `register-role-select` - Role selection dropdown
- `register-password-input` - Password input field
- `register-confirm-password-input` - Confirm password input field
- `toggle-register-password-visibility` - Password visibility toggle
- `register-submit-button` - Register submit button

### Demo Account Buttons
- `demo-account-student` - Student demo account button
- `demo-account-faculty` - Faculty demo account button
- `demo-account-admin` - Admin demo account button
- `mobile-demo-account-student` - Mobile student demo button
- `mobile-demo-account-faculty` - Mobile faculty demo button
- `mobile-demo-account-admin` - Mobile admin demo button

## 🔧 Testing Examples

### Cypress Testing
```javascript
// Test demo account login
cy.get('[data-testid="demo-account-student"]').click()
cy.get('[data-testid="login-submit-button"]').click()

// Test manual login
cy.get('[data-testid="login-email-input"]').type('student@demo.com')
cy.get('[data-testid="login-password-input"]').type('demo123')
cy.get('[data-testid="login-submit-button"]').click()

// Test registration
cy.get('[data-testid="register-tab"]').click()
cy.get('[data-testid="register-fullname-input"]').type('John Doe')
cy.get('[data-testid="register-email-input"]').type('john@example.com')
cy.get('[data-testid="register-role-select"]').select('student')
cy.get('[data-testid="register-password-input"]').type('password123')
cy.get('[data-testid="register-confirm-password-input"]').type('password123')
cy.get('[data-testid="register-submit-button"]').click()
```

### Playwright Testing
```javascript
// Test demo account login
await page.click('[data-testid="demo-account-student"]')
await page.click('[data-testid="login-submit-button"]')

// Test form validation
await page.fill('[data-testid="login-email-input"]', 'invalid-email')
await page.click('[data-testid="login-submit-button"]')
await expect(page.locator('.text-red-700')).toBeVisible()
```

## 🎨 UI Features

### Desktop Layout
- **Left Sidebar**: Branding, demo accounts, and feature list
- **Right Side**: Login/register form with modern styling
- **Responsive Design**: Adapts to different screen sizes

### Mobile Layout
- **Compact Demo Section**: Quick access to demo accounts
- **Touch-Friendly**: Large buttons and inputs
- **Optimized Spacing**: Better mobile experience

### Visual Elements
- **Gradient Backgrounds**: Modern blue-to-indigo gradients
- **Icon Integration**: Lucide React icons throughout
- **Hover Effects**: Smooth transitions and feedback
- **Loading States**: Spinner animations during API calls

## 🔐 Security Features

- **Input Validation**: Client and server-side validation
- **Password Visibility Toggle**: Secure password handling
- **Error Handling**: User-friendly error messages
- **Role-Based Access**: Different permissions per user type

## 📱 Responsive Design

- **Desktop**: Two-column layout with sidebar
- **Tablet**: Stacked layout with full-width forms
- **Mobile**: Single column with compact demo section

## 🚨 Error Scenarios to Test

1. **Invalid Email**: Test with malformed email addresses
2. **Wrong Password**: Test with incorrect passwords
3. **Empty Fields**: Test form submission with empty required fields
4. **Password Mismatch**: Test registration with different passwords
5. **Network Errors**: Test with offline/network issues

## 🎯 Success Scenarios to Test

1. **Demo Account Login**: Click demo buttons and login
2. **Manual Login**: Enter credentials manually
3. **Registration**: Create new accounts
4. **Role Switching**: Test different user roles
5. **Template Access**: Verify role-based template access

## 📊 Performance Testing

- **Load Time**: Test page load performance
- **Form Submission**: Test API response times
- **Mobile Performance**: Test on various devices
- **Network Conditions**: Test with slow connections

## 🔍 Debugging

- **Console Logs**: Check browser console for errors
- **Network Tab**: Monitor API requests/responses
- **Test IDs**: Use test IDs for element selection
- **Error Messages**: Verify error message display

## 📝 Test Checklist

- [ ] Demo account buttons work
- [ ] Login form validation works
- [ ] Registration form validation works
- [ ] Password visibility toggle works
- [ ] Role selection works
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Mobile responsive design works
- [ ] All test IDs are accessible
- [ ] API calls work correctly
- [ ] Authentication state persists
- [ ] Logout functionality works
