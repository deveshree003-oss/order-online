# DealNest — Mediator-to-Customer Deal Platform

DealNest is a full-stack web application that enables mediators to publish product deals and helps customers discover products and access external ordering information through a centralized platform.

## Features
- **Product Discovery:** Browse product listings with images, brands, platforms, and pricing details.
- **Automated Metadata Extraction:** Parse unstructured deal messages and extract product information from webpage metadata and URLs.
- **Admin Dashboard:** Create, update, publish, and manage product posts through an authenticated interface.
- **Secure Data Management:** Use Supabase Auth and PostgreSQL Row Level Security (RLS) to protect administrative operations.
- **Image Storage:** Manage product images using Supabase Storage.
- **Publication Lifecycle:** Organize listings with draft, LIVE, and OVER statuses.

## Tech Stack
Next.js, React, TypeScript, Tailwind CSS, Supabase, PostgreSQL, Vercel.

## Getting Started

```bash
git clone https://github.com/deveshree003-oss/order-online.git
cd order-online
npm install
npm run dev
```

Configure the required Supabase environment variables in `.env.local` before starting the application.

## Future Enhancements
- Visitor analytics and product interaction tracking.
- An admin dashboard for measuring platform usage and impact.
- AI-assisted product categorization and metadata extraction.

## Author
**Deveshree Dhobe** · [GitHub](https://github.com/deveshree003-oss)
