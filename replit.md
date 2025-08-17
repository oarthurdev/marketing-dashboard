# Overview

This is a comprehensive marketing analytics dashboard application that consolidates data from multiple external APIs (CRM, e-commerce, social media ads) into unified KPI dashboards and automated reports. The system implements Extract, Transform, and Load (ETL) processes to normalize data from various platforms and calculate key performance indicators like lead conversion rates, ROI, CPA, and daily revenue metrics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for fast development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Recharts for interactive data visualizations

## Backend Architecture
- **Runtime**: Node.js with Express.js for API endpoints
- **Language**: TypeScript with ES modules for type safety and modern syntax
- **Architecture Pattern**: Service-oriented with separate classes for each external API integration
- **Scheduled Tasks**: Node-cron for automated daily data processing and report generation
- **Error Handling**: Centralized error middleware with structured logging

## Data Storage Solutions
- **Database**: Supabase (PostgreSQL) with Drizzle ORM for type-safe database operations
- **Schema Design**: Normalized tables for metrics, campaigns, activities, API connections, and reports
- **Connection**: Supabase PostgreSQL via connection pooling
- **Migrations**: Drizzle Kit for schema migrations and database management
- **Real-time**: Supabase real-time subscriptions for live dashboard updates

## External API Integrations
- **CRM**: HubSpot API for lead and deal tracking
- **E-commerce**: Shopify Admin API for order and customer data
- **Advertising**: Google Ads API for campaign performance metrics
- **Authentication**: OAuth2 and API key management for secure third-party connections
- **Data Processing**: Scheduled ETL jobs that run daily to collect, transform, and consolidate data

## Key Design Patterns
- **Repository Pattern**: Storage abstraction layer allowing for multiple storage implementations
- **Service Layer**: Dedicated service classes for each external API with error handling and data transformation
- **Factory Pattern**: Flexible report generation supporting multiple formats (HTML, PDF, JSON)
- **Observer Pattern**: Real-time activity feed updates and dashboard refresh mechanisms

# External Dependencies

## Core Infrastructure
- **Database**: Supabase (PostgreSQL with real-time capabilities)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Real-time Updates**: Supabase real-time subscriptions

## Third-party APIs
- **HubSpot CRM**: Contact and deal management integration
- **Shopify**: E-commerce order and customer data
- **Google Ads**: Campaign performance and advertising metrics
- **OAuth2 Providers**: Secure authentication for external services

## Frontend Libraries
- **UI Components**: Radix UI primitives for accessible component foundation
- **Charts**: Recharts for revenue trends and lead source visualizations
- **Form Handling**: React Hook Form with Zod validation
- **Date Utilities**: date-fns for date manipulation and formatting

## Development Tools
- **Build Tool**: Vite with React plugin and TypeScript support
- **Code Quality**: ESBuild for fast production builds
- **Development**: Hot module replacement and error overlay integration
- **Deployment**: Replit-specific plugins for development environment integration