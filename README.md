# Arone Bd

Arone Bd is a Bangladesh-focused e-commerce website built with **Next.js**, **Prisma**, and **PostgreSQL (Neon)**.

The project includes a modern customer storefront, admin business console, order management, inventory, finance, courier management, theme settings, staff permissions, and a backend page / landing-page builder.

## Tech Stack

- Next.js 15
- React
- JavaScript / JSX
- Prisma ORM
- PostgreSQL / Neon
- CSS
- Git & GitHub

## Main Features

### Customer Storefront

- Responsive desktop and mobile design
- Product listing
- Product details
- Product categories
- Search
- Shopping cart
- Customer account
- Order tracking
- Cash on Delivery checkout
- Bangladesh delivery-area support
- Dynamic website theme
- Dynamic frontend logo from Admin Panel

## Admin Panel

The Arone Bd Admin Panel currently includes:

- Overview
- Sales Analytics
- Orders
- Products
- Inventory
- Invoices
- Profit & Expenses
- Courier & Delivery
- Categories
- Ads Tracking
- Pages
- Settings

## Staff Management

Admin can create staff accounts and assign restricted permissions.

Available product permissions include:

- View Products
- Create Products
- Edit Products
- Delete / Archive Products

Example staff roles:

- Viewer
- Product Editor
- Product Manager
- Custom Role

## Theme & Branding

Website branding can be managed from the Admin Panel.

Available settings include:

- Primary Brand Color
- Dark Brand Color
- Light Brand Color
- Frontend Website Logo

Theme and logo settings are stored in the database and loaded dynamically by the storefront.

## Page & Landing Page Builder

Arone Bd includes a backend page builder for creating pages without editing frontend code.

Available page settings include:

- Page Title
- URL Slug
- Draft / Published Status
- Normal Page
- Landing Page
- SEO Title
- SEO Description
- Featured Image
- Show / Hide Header
- Show / Hide Footer
- Full Width Layout

### Available Page Sections

- Hero Banner
- Text
- Image + Text
- Product Grid
- Call To Action
- FAQ

Sections can be:

- Added
- Edited
- Moved Up / Down
- Duplicated
- Deleted

## Project Structure

```text
app/
├── admin/
│   ├── analytics/
│   ├── orders/
│   ├── products/
│   ├── inventory/
│   ├── invoices/
│   ├── finance/
│   ├── courier/
│   ├── categories/
│   ├── ads-tracking/
│   ├── pages/
│   └── settings/
│
├── api/
│   ├── admin/
│   ├── auth/
│   ├── products/
│   ├── theme/
│   └── tracking/
│
├── landing/
├── page/
└── layout.js

components/
lib/
prisma/
public/
