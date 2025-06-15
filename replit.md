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

## Recent Changes (June 2025)
- **June 15, 2025:** Enhanced Procurement module with expiry date tracking and dual discount system
- **June 15, 2025:** Implemented comprehensive Customer Accounts tab in Accounting module with ETA compliance
- **June 15, 2025:** Fixed UI layout issues using proper 12-column grid system for better responsiveness
- **June 15, 2025:** Created complete Docker deployment setup with multi-stage builds and orchestration
- **June 15, 2025:** Fixed Docker Compose ContainerConfig compatibility issues with manual deployment solution
- **June 15, 2025:** Consolidated Docker setup into single production-ready Dockerfile with simplified deployment
- **June 15, 2025:** Created separate frontend Dockerfile with Nginx for complete containerized deployment
- **June 15, 2025:** Fixed Dockerfile.frontend syntax errors and created proper nginx configuration files

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
- **Accounting Module:** Customer accounts history, payment tracking, ETA numbers for Egyptian tax compliance
- **Dashboard:** Real-time analytics and comprehensive business metrics
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