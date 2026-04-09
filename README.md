# Cloud Infrastructure Visualizer

## Overview
A full-stack web application designed to authenticate users and generate dynamic, graph-based visualizations of their cloud infrastructure. The system securely connects to a user's AWS account, scans the existing architecture, and maps out the relationships between resources like VPCs, Subnets, EC2 instances, S3 buckets, and RDS databases.

## Features
* **Secure User Authentication:** JWT-based user login and registration.
* **Dynamic Graph Visualization:** Interactive node-and-edge mapping of cloud environments.
* **Hierarchical Layouts:** Visualizes nested resources (e.g., EC2 instances sitting correctly within their respective Subnets and VPCs).
* **Cross-Account AWS Access:** Securely fetches live infrastructure data using AWS STS.

## Tech Stack
* **Frontend:** Angular 21, Cytoscape.js (for high-performance graph visualization), TypeScript.
* **Backend:** Node.js, Express.js, AWS SDK v3 (EC2, S3, RDS, STS).
* **Database:** PostgreSQL hosted on Supabase (via `pg` pool).

## Security Architecture: The External ID Advantage
Security is a critical priority when handling cross-account AWS access. While standard implementations often only ask for an IAM Role ARN to assume a role, this approach leaves systems vulnerable to the **Confused Deputy Problem**.

**The Real-World Problem Solved:** If this application only required a Role ARN, a malicious actor who discovers your ARN could input it into their own account on the platform, tricking our application (the "deputy") into fetching and displaying your private infrastructure data to them. 

**The Implementation:** To neutralize this threat, this backend enforces the use of an **AWS External ID** during the `AssumeRoleCommand`. 
1. The database generates and stores a unique `aws_external_id` for the authenticated user.
2. The user configures their AWS IAM Trust Policy to mandate this exact External ID.
3. When the backend assumes the role, it passes both the ARN and the External ID. 

This ensures that the role can strictly only be assumed when the request originates from the legitimate user's session, providing enterprise-grade security for third-party integrations.

## Core Visualization Logic
The backend processes raw AWS SDK responses and normalizes them into a structured `Nodes` and `Edges` format optimized for Cytoscape.js:
* **Top-Level Containers:** VPCs are mapped as parent nodes.
* **Nested Containers:** Subnets are assigned a `parentId` linking them to VPCs. Resources like EC2 and NAT Gateways are assigned `parentId`s linking them to their specific Subnets.
* **Relational Edges:** Connections are dynamically drawn, such as mapping Internet Gateways attached to VPCs, or Security Groups protecting specific EC2 instances.

## Screenshots

### 1. User Dashboard & Infrastructure Graph
> [!NOTE] 
> Add screenshot here showing the Cytoscape graph rendering the VPCs, EC2s, and databases.
> `![Infrastructure Graph](./screenshots/graph.png)`

### 2. Secure AWS Setup
> [!NOTE] 
> Add screenshot here showing the form where the user inputs their Role ARN and the application provides the External ID.
> `![AWS Setup](./screenshots/setup.png)`

## Local Setup Instructions

### Prerequisites
* Node.js (v18+)
* Angular CLI
* PostgreSQL Database URL

### Backend Setup
1. Navigate to the `backend/` directory.
2. Run `npm install`.
3. Create a `.env` file and add the following:
   ```text
   DATABASE_URL=<your_postgres_url>
   APP_AWS_ACCESS_KEY_ID=<your_iam_user_key>
   APP_AWS_SECRET_ACCESS_KEY=<your_iam_user_secret>
   APP_AWS_REGION=ap-south-1
   APP_AWS_ACCOUNT_ID=<your_account_id>