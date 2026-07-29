# Smart Vault Pro

Project Name: SmartVault

Tagline

Secure Everything. Access Anywhere.

Project Overview

Build SmartVault, a premium cloud-based file management application that allows users to securely upload, organize, search, rename, download, and delete files from anywhere. Every user has a private cloud workspace where all files are securely stored and synchronized across devices.

The application should feel like a product built by a multi-billion-dollar software company—clean, modern, minimal, fast, and reliable. The focus should be on simplicity, usability, security, and performance rather than flashy visual effects.

This application must be fully production-ready, mobile-first, highly scalable, and free of runtime errors.

Design Philosophy

SmartVault should follow modern enterprise software design principles similar to:

Apple

Google Drive

Dropbox

Notion

Linear

Stripe

Arc Browser

Figma

The interface must be:

Minimal

Modern

Elegant

Professional

Fast

Clean

Responsive

Mobile-first

Enterprise-grade

The UI should prioritize clarity, generous spacing, and excellent usability.

Avoid anything that looks cluttered or overly decorative.

Color System

Primary Color

Blue

Use Blue for:

Branding

Active navigation

Selected tabs

Focus states

Links

Icons

Accent Color

Orange

Use Orange for:

Primary buttons

Floating Upload Button

Upload progress

Call-to-action buttons

Active upload indicators

Orange should never overpower the interface.

Visual Style

The application should NOT use:

Particle backgrounds

Floating animations

Neon effects

Heavy gradients

Distracting backgrounds

Overdone glassmorphism

Fancy 3D effects

Visual clutter

Instead use:

Clean white backgrounds (Light Mode)

Clean dark gray backgrounds (Dark Mode)

Soft shadows

Thin borders

Rounded corners

Plenty of whitespace

Professional typography

Everything should feel simple and premium.

Typography

Use:

Inter (Preferred)

Geist (Alternative)

Use consistent typography hierarchy.

Large readable headings.

Comfortable spacing.

Authentication

Users must authenticate before accessing SmartVault.

Authentication methods:

Google Sign In

Email Registration

Email Login

Secure Logout

Signup Screen

Include:

SmartVault logo

Tagline

Sign up with Google

Email input

Password input

Confirm password

Password visibility toggle

Submit button

Link to Login page

Validation:

Valid email

Strong password

Password confirmation

Friendly validation messages

Login Screen

Include:

Email

Password

Remember Me

Forgot Password

Login button

Google Login

Successful login opens Home.

Logout returns to Login.

Home Screen

The Home Screen contains:

Navigation Menu

Located top-left.

Opens a smooth slide drawer.

Drawer closes by:

Clicking outside

Back gesture

Escape key

Drawer Contents

Bin

Displays deleted files.

Each deleted file includes:

Restore

Delete Permanently

Permanent deletion removes files from:

Supabase Storage

Database

Never delete files stored on the user's personal device.

Theme

Allow users to switch:

Light

Dark

System

Persist preference.

User Profile

Display:

Avatar

Name

Email

Menu:

Account Settings

Logout

Search

Located below the navigation bar.

Instant search across:

File names

Text notes

Images

ZIP

PDF

Videos

Results update immediately while typing.

Categories

Below Search.

Categories:

All Files (Default)

Text

Images

ZIP

PDF

Videos

Filtering should be instant.

No loading required.

Main File Area

Display uploaded files as premium cards.

If empty show:

No Files Yet

Each card displays:

File icon

Filename

Upload date

File type

File size

File Actions

Long press or three-dot menu.

Options:

Rename

Rename file.

Update instantly.

Delete

Move to Bin.

Do not permanently remove.

Download

Download original file.

Must always work correctly.

Floating Upload Button

Located bottom-left.

Orange circular Floating Action Button.

Contains plus icon.

Smooth animation.

Click opens Upload Screen.

Upload Screen

Contains:

Back button

File Name

Required.

Cannot be empty.

File Type

Dropdown:

Text

Image

ZIP

PDF

Video

Upload Rules

Text

Display large text editor.

Paste or type notes.

No file picker.

Images

Maximum:

5 Images

Preview before upload.

ZIP

Maximum:

1 ZIP file.

PDF

Maximum:

1 PDF.

Video

Maximum:

1 Video.

Display upload progress.

Save

Uploads directly to Supabase Storage.

Creates database record.

Immediately appears under:

Selected category

All Files

Cloud Storage

Never use Local Storage.

Use:

Supabase Authentication

Supabase Storage

PostgreSQL Database

Every file belongs only to its owner.

If users:

logout

switch phones

switch computers

Their files remain available after login.

Database

Users Table

id

email

avatar

created_at

Files Table

id

user_id

filename

category

storage_url

file_size

mime_type

created_at

updated_at

deleted

UI Components

Cards

Rounded corners

Thin border

Soft shadow

Spacious padding

Buttons

Orange

Rounded

Accessible

Hover animation

Click animation

Inputs

Rounded

Clean

Modern

Clear validation

Navigation Drawer

Smooth slide animation

Blur overlay

Responsive

Animations

Keep animations subtle.

Include only:

Page transitions

Fade-ins

Drawer slide

Button press

Upload progress

Success animation

Loading skeletons

Toast notifications

Animation duration:

150–250ms

No unnecessary effects.

Performance

The application must be optimized.

Requirements:

Lazy loading

Code splitting

Image optimization

Fast search

Instant filtering

Responsive layout

Smooth 60 FPS

Upload progress

Retry failed uploads

Offline detection

Optimistic UI updates

Accessibility

Follow WCAG 2.2 AA guidelines.

Support:

Keyboard navigation

Screen readers

Visible focus indicators

High contrast

Touch-friendly controls

Proper ARIA labels

Security

Supabase Row Level Security (RLS)

Secure authentication

Protected API routes

File ownership validation

Secure downloads

Encrypted HTTPS communication

Input sanitization

File type validation

File size limits

Prevent unauthorized access

Error Handling

The application must never crash.

Implement:

Input validation

Friendly error messages

Retry mechanisms

Loading states

Empty states

Network error handling

Upload failure recovery

Duplicate prevention

No uncaught runtime errors.

Technology Stack

Frontend

Next.js (App Router)

React

TypeScript

Tailwind CSS

Framer Motion

Backend

Supabase Authentication

Supabase Storage

PostgreSQL Database

Row Level Security (RLS)

Forms & Validation

React Hook Form

Zod

UI

Lucide React Icons

Code Quality Requirements

Clean Architecture

Modular folder structure

Reusable components

Type-safe code

Strict TypeScript

ESLint

Prettier

Consistent naming conventions

Production-ready project structure

Well-documented code

Scalable architecture

No duplicate code

No unused dependencies

Final AI Instruction

Build SmartVault as a polished, enterprise-grade cloud file management platform that feels comparable to world-class productivity software. Every design decision should prioritize simplicity, speed, security, and usability. The interface should be minimal and elegant with a blue primary color and orange call-to-action buttons, avoiding flashy effects or clutter. Use Next.js, React, TypeScript, Tailwind CSS, Framer Motion, and Supabase to create a secure, scalable, and responsive application with seamless authentication, cloud storage, fast search, intuitive file management, and reliable downloads. The final product must be fully functional, production-ready, accessible, performant, maintainable, and free of runtime errors.



## Build by samuel Ajibade

- **Stay in sync**: every change made by Samuel Ajibade is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
