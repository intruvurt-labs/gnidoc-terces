# Overview

GINDOC is a comprehensive AI-powered development platform specializing in complete code generation, blockchain security analysis, and multi-modal content creation. Created by **Intruvurt Labs** and developed by **Doble Duche**, GINDOC orchestrates multiple AI models to provide comprehensive solutions for modern development challenges.

The platform features a cyberpunk-themed interface with the distinctive GINDOC logo and integrates multiple AI services including Google's Gemini for code generation and security analysis, Imagen 3.0 for image generation, and Runway ML for video generation. GINDOC supports uploading code files for analysis, accepts up to 50,000 characters in prompts, and provides complete downloadable solutions with real-time security monitoring.

Key capabilities include:
- Full-stack application generation with complete file structures
- Advanced blockchain and smart contract security analysis
- Real-time code vulnerability detection and recommendations
- Multi-modal content creation (code, images, videos)
- File upload support for code analysis and enhancement
- Background removal from generated images
- Complete project management with downloadable files
- Firebase integration for enhanced data storage and analytics

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with a cyberpunk design system featuring custom color variables and animations
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation integration

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with centralized route registration
- **Error Handling**: Global error middleware with structured error responses
- **Development**: Hot module replacement via Vite middleware integration

## Data Storage Architecture
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL
- **Schema**: Structured tables for users, projects, generated files, and security scans
- **Migrations**: Drizzle Kit for database schema management
- **Development Fallback**: In-memory storage implementation for development/testing

## AI Service Integration
- **Primary AI**: Google Generative AI (Gemini) for code generation and text processing
- **Image Generation**: Google Imagen 3.0 for image creation
- **Video Generation**: Runway ML for video content creation
- **Orchestration**: Centralized AI service orchestrator that manages multiple AI model interactions
- **Processing**: Asynchronous generation with progress tracking and status updates

## Authentication & Session Management
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **User Management**: Basic user authentication with username/password storage
- **Security**: Prepared for security scanning features with dedicated schema tables

## Project Structure
- **Monorepo**: Shared types and schemas between frontend and backend
- **Client**: React application with component library and custom hooks
- **Server**: Express API with service layer architecture
- **Shared**: Common TypeScript types and Zod schemas for validation
- **Assets**: Static file management for generated content

## Development & Deployment
- **Build System**: Vite for frontend bundling, esbuild for backend compilation
- **Development**: Concurrent frontend/backend development with proxy configuration
- **Environment**: Environment-based configuration for database and API keys
- **Replit Integration**: Custom plugins for development environment integration

# External Dependencies

## AI Services
- **Google Generative AI**: Primary AI service for code generation and text processing
- **Google Imagen**: Image generation API for creating visual content
- **Runway ML**: Video generation service for multimedia content creation

## Database & Storage
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database query builder and migration tool

## UI & Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **React Query**: Server state management and caching

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type checking and development experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit**: Cloud development environment integration

## Session & Authentication
- **connect-pg-simple**: PostgreSQL session store for Express
- **Express Session**: Session middleware for user authentication