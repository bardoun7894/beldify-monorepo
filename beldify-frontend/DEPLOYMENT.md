# Next.js Deployment Guide

This document outlines the deployment process for the Beldify frontend application, both for local development and production environments.

## Local Development with Docker

Docker provides a consistent development environment that closely mirrors production. This approach helps identify and resolve environment-specific issues early in development.

### Prerequisites

- Docker and Docker Compose installed on your local machine
- Project source code (cloned from repository)

### Local Development Steps

1. **Navigate to Project Directory:**
   ```bash
   cd /var/www/html  # Or your local project directory
   ```

2. **Environment Setup:**
   Ensure you have a `.env.development` file in your project root with necessary environment variables for local development.

3. **Start Development Container:**
   ```bash
   # Using the npm script (recommended)
   npm run docker:dev
   
   # Or directly with docker-compose
   docker-compose up --build
   ```
   
   This command:
   - Builds the Docker image using the `builder` target from the Dockerfile
   - Mounts your local code into the container for hot reloading
   - Starts the Next.js development server on port 3000
   - Sets up environment variables from `.env.development`

4. **Access the Application:**
   Open your browser and navigate to `http://localhost:3000`

5. **Development Workflow:**
   - Changes to your code will be automatically detected and the application will reload
   - Container logs will be displayed in your terminal
   - Press `Ctrl+C` to stop the development container

6. **Stopping the Container:**
   ```bash
   # If you used docker-compose up directly and detached (-d flag)
   docker-compose down
   ```

### Troubleshooting Local Development

1. **Port Conflicts:**
   If port 3000 is already in use, modify the port mapping in `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"  # Maps host port 3001 to container port 3000
   ```

2. **Hot Reload Not Working:**
   Ensure `CHOKIDAR_USEPOLLING=true` is set in the environment variables section of `docker-compose.yml`.

3. **Node Modules Issues:**
   If you encounter module resolution problems, you may need to rebuild the container:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

4. **Viewing Container Logs:**
   ```bash
   # If running in detached mode
   docker logs beldify-dev -f
   ```

## Production Deployment (Docker)

This guide uses Docker to containerize and deploy the Beldify frontend application in production.

### Prerequisites

- Docker installed on the deployment server.
- Project source code available on the server (e.g., via Git clone).

### Configuration Files

Ensure the following files are present and correctly configured in your project root (`/var/www/html`):

- `Dockerfile`: Defines the steps to build the production Docker image.
- `.dockerignore`: Excludes unnecessary files from the Docker build context.
- `package.json`: Contains project dependencies and scripts (`build:prod`, `start:prod`).
- `next.config.js` / `next.config.prod.js`: Next.js configuration files. The `Dockerfile` uses `next.config.prod.js` for the production build and runtime.
- Environment variables (`.env.production`): While `.env*` files are excluded by `.dockerignore`, you'll need to pass necessary environment variables to the container at runtime (see Deployment Steps).

### Deployment Steps

1.  **Navigate to Project Directory:**
    ```bash
    cd /var/www/html
    ```

2.  **Ensure Latest Code:**
    Pull the latest changes if using version control:
    ```bash
    git pull origin main # Or your relevant branch
    ```

3.  **Build the Docker Image:**
    Build the image using the `Dockerfile`. Tag it appropriately (e.g., `beldify-frontend:latest` or with a version number).
    ```bash
    docker build -t beldify-frontend .
    ```
    *(This uses the image name `beldify-frontend` as suggested in previous steps)*

4.  **Stop and Remove Old Container (if running):**
    If a previous version of the container is running, stop and remove it first.
    ```bash
    docker stop beldify-frontend-container || true # Stop the container if it exists
    docker rm beldify-frontend-container || true   # Remove the container if it exists
    ```
    *(Using `beldify-frontend-container` as the container name)*

5.  **Run the New Container:**
    Run the newly built image as a container. Map the required port (3000) and pass any necessary environment variables.
    ```bash
    docker run -d \
      --name beldify-frontend-container \
      -p 3000:3000 \
      --restart always \
      # Add -e flags for any required environment variables, e.g.:
      # -e NEXT_PUBLIC_API_URL="https://your-api.com" \
      # Or use --env-file if you have an environment file prepared for Docker
      beldify-frontend
    ```
    - `-d`: Run in detached mode (background).
    - `--name`: Assign a name to the container for easier management.
    - `-p 3000:3000`: Map host port 3000 to container port 3000.
    - `--restart always`: Automatically restart the container if it stops.
    - Add `-e VARIABLE=value` or `--env-file path/to/.env.docker` for environment variables needed by your application at runtime. **Do not commit sensitive data directly in the Dockerfile.**

6.  **Verify Deployment:**
    Check if the container is running and view its logs.
    ```bash
    docker ps # Check running containers
    docker logs beldify-frontend-container # View application logs
    ```
    You should be able to access the application via the server's IP address or domain name on port 3000.

7.  **(Optional) Clean Up Old Images:**
    Periodically remove unused Docker images to save disk space.
    ```bash
    docker image prune -f
    ```

## Troubleshooting (Docker)

1.  **Container Management**
    - List running containers: `docker ps`
    - List all containers (including stopped): `docker ps -a`
    - View container logs: `docker logs beldify-frontend-container`
    - Follow container logs: `docker logs -f beldify-frontend-container`
    - Stop container: `docker stop beldify-frontend-container`
    - Start container: `docker start beldify-frontend-container`
    - Restart container: `docker restart beldify-frontend-container`
    - Access container shell (for debugging): `docker exec -it beldify-frontend-container /bin/sh` (Alpine uses `sh`)

2.  **Common Issues**
    - **Port Conflict:** Host port 3000 already in use. Stop the process using the port or map the container to a different host port (e.g., `-p 3001:3000`).
    - **Build Failures:** Check the output of `docker build` for errors (e.g., missing dependencies, syntax errors in `Dockerfile`). Ensure `.dockerignore` is not excluding necessary files.
    - **Container Fails to Start/Keeps Restarting:** Check `docker logs` for application errors. Common causes include missing environment variables, incorrect configuration, or application crashes.
    - **Permission Issues:** Ensure files copied into the image have correct permissions. Docker usually handles this, but complex setups might require adjustments.

## Maintenance (Docker)

-   **Updating the Application:**
    1.  Pull latest code (`git pull ...`).
    2.  Rebuild the image (`docker build -t beldify-frontend .`).
    3.  Stop and remove the old container (`docker stop/rm ...`).
    4.  Run the new image (`docker run ...`).
    *Consider using Docker Compose or Kubernetes for more robust update strategies (e.g., rolling updates).*
-   **Updating Dependencies:** Run `npm update` locally or in a build environment, commit `package-lock.json`, then rebuild the Docker image.
-   **Log Management:** Docker logs can grow large. Configure Docker's logging drivers (e.g., `json-file` with size/rotation limits) or forward logs to a centralized logging system.
-   **Monitoring:** Use `docker stats beldify-frontend-container` for basic resource usage. Integrate with external monitoring tools (Prometheus, Grafana, Datadog, etc.) for comprehensive monitoring.
-   **Security Updates:** Regularly update the base Node.js image (`node:20-alpine`) in your `Dockerfile` and rebuild to incorporate security patches.

## Security Considerations

- Ensure proper CORS configuration
- Keep dependencies updated
- Use environment variables for sensitive data
- Configure proper SSL/TLS in production

## Backup Procedures (Docker Context)

1.  **Before Major Deployments:**
    -   Ensure your source code (including `Dockerfile`, configs) is committed to version control.
    -   Backup any persistent data volumes used by the container (if applicable - this setup doesn't define volumes, but stateful apps might).
    -   Optionally, tag the previous working Docker image (`docker tag beldify-frontend:latest beldify-frontend:backup-YYYYMMDD`).

2.  **Regular Backups:**
    -   **Source Code:** Regularly back up your Git repository.
    -   **Environment Configuration:** Securely back up the method used to provide environment variables (e.g., `.env` files used with `--env-file`, or infrastructure-as-code definitions).
    -   **Persistent Data:** If your application stores data outside the container (e.g., in a database or external volume), ensure those have their own robust backup strategy. User uploads managed via S3 (as hinted in configs) should rely on S3's backup/versioning features.

## Additional Resources

-   [Docker Documentation](https://docs.docker.com/)
-   [Next.js Docker Deployment](https://nextjs.org/docs/app/building-your-application/deploying/docker)
-   [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
