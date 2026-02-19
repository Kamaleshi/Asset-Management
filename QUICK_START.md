# Quick Start Guide - Asset Management System

## Prerequisites
- Node.js installed (v14 or higher)
- npm or yarn package manager

## Step-by-Step Instructions

### 1. Install Backend Dependencies

Open a terminal in the project root and run:

```bash
cd backend
npm install
```

### 2. Start the Backend Server

While still in the `backend` directory:

```bash
npm start
```

You should see:
```
Backend running on http://localhost:5000
```

**Keep this terminal window open!**

### 3. Install Frontend Dependencies

Open a **NEW** terminal window in the project root and run:

```bash
cd frontend
npm install
```

### 4. Start the Frontend Server

While in the `frontend` directory:

```bash
npm start
```

The browser should automatically open to `http://localhost:3000`

If it doesn't, manually navigate to: **http://localhost:3000**

## Testing the Application

### Login Credentials:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**User Account:**
- Username: `user`
- Password: `user123`

### What to Test:

1. **Login Page** (`/login`)
   - Try logging in with both admin and user credentials
   - Verify error handling with wrong credentials

2. **Dashboard** (`/`)
   - Admin: Should see Total Assets, Assigned, Available, and Total Users
   - User: Should see Total Assets, Assigned, and Available (no Users stat)

3. **Assets Page** (`/assets`)
   - Should display a table with assets
   - Admin: Should see Edit/Delete buttons
   - User: Should only see the asset list

4. **Users Page** (`/users`)
   - **Admin only**: Should display users table
   - **User**: Should be redirected (access denied)

5. **Navigation**
   - Sidebar should show different links based on role
   - Users link only visible to admins
   - Active route highlighting

6. **Theme Toggle**
   - Click the theme toggle button in topbar
   - Should switch between light and dark mode

7. **Logout**
   - Click logout button
   - Should redirect to login page

## Troubleshooting

### Backend won't start:
- Make sure port 5000 is not in use
- Check if all dependencies are installed: `npm install` in backend folder
- Verify Node.js version: `node --version` (should be v14+)

### Frontend won't start:
- Make sure port 3000 is not in use
- Check if all dependencies are installed: `npm install` in frontend folder
- Clear cache: `npm cache clean --force`

### API Connection Issues:
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify `frontend/src/api/api.js` has correct baseURL: `http://localhost:5000/api`

### Login not working:
- Check browser console for errors
- Verify backend is running
- Check Network tab in browser DevTools to see API calls

## Running Both Servers (Windows PowerShell)

You can run both servers in separate PowerShell windows:

**Terminal 1 (Backend):**
```powershell
cd backend
npm install
npm start
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm install
npm start
```

## Alternative: Using npm-run-all (Optional)

If you want to run both servers with one command, you can install `npm-run-all` in the root directory and create a script, but for now, running them separately is recommended for easier debugging.

