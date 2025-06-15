# Quick Docker Permission Fix

## The Problem
You're getting a "Permission denied" error when trying to run Docker commands. This is because your user account doesn't have permission to access the Docker daemon.

## Quick Solutions

### Option 1: Add User to Docker Group (Recommended)
```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply the group change
newgrp docker

# Test Docker access
docker --version

# Now run the startup script
./docker-start.sh
```

### Option 2: Run with Sudo (Temporary Fix)
```bash
# Run the startup script with sudo
sudo ./docker-start.sh
```

### Option 3: Manual Docker Commands
```bash
# Start Docker daemon if not running
sudo systemctl start docker
sudo systemctl enable docker

# Build and run with sudo
sudo docker-compose up --build -d

# Check status
sudo docker-compose ps

# View logs
sudo docker-compose logs -f
```

## Alternative: Run Without Docker

If Docker continues to cause issues, you can run the application normally:

```bash
# Install dependencies
npm install

# Start the application
npm run dev
```

The application will run on http://localhost:5000

## Verify Docker Setup

After fixing permissions, test with:
```bash
# Check Docker info
docker info

# Test simple container
docker run hello-world

# Check compose version
docker-compose --version
```

## Production Deployment

For production servers, ensure:
1. Docker daemon starts on boot: `sudo systemctl enable docker`
2. User is in docker group: `groups $USER | grep docker`
3. Firewall allows port 5000: `sudo ufw allow 5000`