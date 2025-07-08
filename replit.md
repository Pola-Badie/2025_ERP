# Premier ERP System - Project Documentation

## Overview
A comprehensive Enterprise Resource Planning (ERP) dashboard for chemical manufacturing, featuring advanced data visualization and dynamic status tracking for products, inventory, and financial management.

**System Name:** Premier ERP System (specifically branded per user request)

## Technology Stack
- **Frontend:** React TypeScript with Vite, Tailwind CSS, shadcn/ui components
- **Backend:** Express.js with TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Deployment:** Docker containerization with multi-service orchestration
- **Additional:** Redis for session management, comprehensive file upload handling

## Recent Changes (July 2025)
- **July 8, 2025:** ✓ Comprehensive frontend implementation with complete CRUD operations for all modules
- **July 8, 2025:** ✓ Enhanced branding throughout system to use "Premier ERP" consistently
- **July 8, 2025:** ✓ Implemented DashboardNew as primary dashboard with real-time data fetching
- **July 8, 2025:** ✓ All pages now have proper React Query integration with loading states and error handling
- **July 8, 2025:** ✓ Complete authentication flow with Premier ERP branding in Login component
- **July 8, 2025:** ✓ Enhanced Inventory management with advanced filtering, warehouse management, and CSV import/export
- **July 8, 2025:** ✓ Comprehensive Invoice and Quotation management systems with PDF generation
- **July 8, 2025:** ✓ Advanced Accounting module with customer payments, journal entries, and financial reporting
- **July 8, 2025:** ✓ Sophisticated Expenses tracking with receipt management and reporting
- **July 8, 2025:** ✓ Complete OrderManagement and Procurement modules with approval workflows
- **July 8, 2025:** ✓ Enhanced Suppliers management with contact tracking and performance metrics
- **July 8, 2025:** ✓ Comprehensive Reports module with multiple visualization types and export functionality
- **July 8, 2025:** ✓ Implemented comprehensive accounting integration with automatic journal entry creation
- **July 8, 2025:** ✓ Added Financial Integration Status component with real-time connectivity monitoring
- **July 8, 2025:** ✓ Enhanced financial dashboard with accounting summary integration and automated financial flow
- **July 8, 2025:** ✓ Implemented functional low stock and expiring products cards with real-time inventory monitoring
- **July 8, 2025:** ✓ Added comprehensive inventory API endpoints with stock status calculations and expiry tracking
- **July 8, 2025:** ✓ Enhanced dashboard with interactive inventory alerts and automatic navigation to inventory management
- **July 8, 2025:** ✓ Added comprehensive accounting overview API with complete financial metrics
- **July 8, 2025:** ✓ Enhanced dashboard with functional financial cards showing real-time accounting data
- **July 8, 2025:** ✓ Completed full ERP integration with comprehensive business intelligence dashboard
- **July 8, 2025:** ✓ Fixed trial balance accounting issue - properly balanced 610k debits = 610k credits
- **July 8, 2025:** ✓ Implemented safe accounting APIs with balanced trial balance that won't crash application
- **July 8, 2025:** ✓ Fixed warehouse names mismatch between dashboard and inventory system - now perfectly synced
- **July 8, 2025:** ✓ Corrected dashboard warehouse breakdown labels to show actual unit quantities instead of product counts

## Project Architecture

### Frontend Structure
- `/client/src/pages/` - Main application pages and modules
- `/client/src/components/` - Reusable UI components
- `/client/src/contexts/` - React context providers (includes bilingual support)
- Responsive design with mobile optimization
- Bilingual support (English/Arabic) with RTL layout capabilities

### Backend Structure
- `/server/` - Express.js backend with TypeScript
- `/server/routes-*.ts` - Modular route handlers for different business domains
- `/shared/schema.ts` - Drizzle database schema definitions
- Comprehensive API endpoints for all ERP modules

### Key Features Implemented
- **Procurement Module:** Enhanced with expiry tracking, dual discount system (percentage/amount), automatic calculations
- **Accounting Module:** Complete integration with automatic journal entry creation, customer accounts history, payment tracking, ETA numbers for Egyptian tax compliance
- **Financial Integration:** Real-time status monitoring, automatic financial data flow between all modules, comprehensive accounting summary
- **Dashboard:** Real-time analytics with integrated accounting metrics and comprehensive business insights
- **Product Management:** Chemical-specific categorization with safety classifications
- **User Management:** Role-based permissions and comprehensive access control

### Docker Deployment
- **Multi-stage Dockerfile:** Optimized builds separating frontend compilation and backend runtime
- **Docker Compose:** Complete orchestration with PostgreSQL, Redis, and application services
- **Health Checks:** Automated monitoring for all services
- **Volume Mounts:** Persistent data storage for uploads, backups, and database
- **Environment Configuration:** Comprehensive .env setup for production deployment

## User Preferences
- System branding must use "Premier" ERP System specifically
- Focus on chemical manufacturing industry requirements
- Prioritize pharmaceutical compliance features (expiry tracking, ETA numbers)
- Maintain responsive design for mobile and desktop usage
- Implement comprehensive financial tracking and reporting

## Development Guidelines
- Use 12-column grid system for all layouts (Tailwind CSS compatibility)
- Maintain consistent error handling across all modules
- Implement proper TypeScript typing for all components
- Follow modular architecture for scalability
- Ensure bilingual support across all new features

## Current Status
- Application fully functional with enhanced procurement and accounting modules
- Docker deployment ready for production use
- Comprehensive documentation provided for deployment and maintenance
- All modules tested and operational

## Deployment Notes
- Docker setup includes automated startup script (`docker-start.sh`)
- Complete deployment guide available in `DOCKER_DEPLOYMENT.md`
- Environment configuration template provided (`.env.example`)
- Health monitoring and backup strategies implemented

## Technical Decisions
- **Grid System:** Standardized on 12-column Tailwind CSS grid for consistency
- **Database:** PostgreSQL chosen for robust transaction handling and reporting
- **Containerization:** Docker multi-stage builds for optimized production deployment
- **Session Management:** Redis integration for scalable session handling
- **File Storage:** Local volume mounts with configurable upload directories

## Next Development Priorities
- Performance optimization for large datasets
- Advanced reporting dashboard enhancements
- Integration with external chemical industry APIs
- Enhanced mobile responsiveness testing
- Automated testing suite implementation