# UACAS - University Accreditation & Compliance Automation System

UACAS is a production-ready, enterprise SaaS platform designed for universities to automate the complex processes of institutional accreditation (NAAC, NBA, NIRF, AISHE).

## Core Modules
- **Institutional Repository**: Single entry point for Faculty, Student, and Infrastructure data.
- **AI Smart Hub**: Gemini-powered narrative generation for Self Study Reports (SSR).
- **Accreditation Tracker**: Real-time readiness scoring for NAAC Criteria (C1-C7).
- **OBE Engine**: Automated CO-PO attainment calculations and mapping.
- **Evidence Vault**: Centralized management for DVV (Data Validation and Verification) documents.
- **PDF Generation**: High-fidelity report exports with institutional branding.

## Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion + Lucide.
- **Backend**: Node.js (Express) + Gemini 1.5 Pro.
- **Database**: Prisma ORM with Multi-tenant schema.
- **Document Engine**: PDF-Lib for enterprise-grade report generation.

## Key Features
1. **AI SSR Narratives**: Generate high-quality academic narratives based on institutional highlights.
2. **Unified Data Entry**: Data entered once is automatically formatted for NAAC, NBA, and AISHE.
3. **Live Compliance Score**: Real-time predictive grading based on the latest accreditation norms.

## Setup & Deployment
1. Install dependencies: `npm install`
2. Generate Prisma client: `npx prisma generate`
3. Start development server: `npm run dev`
4. Deploy to production: Use `npm run build` to generate the `dist/server.cjs` bundle.

Developed for high-stakes university accreditation readiness.
