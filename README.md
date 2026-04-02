# CS4211 Project 4 — AI Sports Coach with LLM & Formal Methods

This project builds an AI Sports Coach that bridges natural language queries with formal verification using the PAT model checker. Unlike traditional LLM chatbots that hallucinate probabilities, the system acts as a tool-using agent: it translates user questions into parametric PCSP# models, runs PAT to compute verified win probabilities, and synthesises the results into actionable coaching advice.

The two core analysis modes are **Reachability** (predicting win probability) and **Sensitivity** (optimising player strategy).

The system is implemented in Node.js and integrates an LLM (GPT-4o) for natural language understanding and tool orchestration, a player statistics database for real match data, and PAT for formal verification. The primary interface is a web chatbot, with a parametric PCSP# tennis tiebreak model at its core that accepts injected player statistics as parameters.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Node.js 20+ and ppnpm installed
- An OpenAI API key
- The raw CSV dataset (obtain from the TA's Google Drive — not included in the repo)

---

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd cs4211-ai-tennis-coach
```

### 2. Set up environment variables

```bash
cp .env.development.example .env.development
```

Open `.env.development` and fill in your `OPENAI_API_KEY`.

### 3. Start all services

```bash
pnpm run dev:docker
```

### 4. Set up the application schema

```bash
cd server
pnpm run db:dev:setup
cd ..
```

This runs migrations and seeds the application database (users, conversations).

---

## Accessing the App

| Service  | URL                                                   |
| -------- | ----------------------------------------------------- |
| Webapp   | http://localhost:5173                                 |
| Server   | http://localhost:3000/api/health                      |
| Database | `localhost:5432` (user: `cs4211_admin`, db: `cs4211`) |

---

## Subsequent Starts

After the first setup, just run:

```bash
pnpm run dev:docker
```

No need to re-seed the database unless you run `docker compose down -v`.

---

# Deployment Notes

1. Download Deps

https://www.postgresql.org/download/
https://nodejs.org/en/download
https://nssm.cc/download

2. Set DNS Records (Namecheap)

   A record:
   - Type: A
   - Name: cs4211-origin
   - Value: {{{ec2IpAddress}}}
   - TTL: auto

   CNAME record:
   - Type: CNAME
   - Name: cs4211-server
   - Value: {{{cloudfrontDomain}}}
   - TTL: auto

3. Configure Firewall

```
New-NetFirewallRule -DisplayName "HTTP Port 80" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "App Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow
```

4. Stop IIS (conflicts with port 80)

```
iisreset /stop
```

To prevent IIS from starting on reboot:

```
Set-Service -Name W3SVC -StartupType Disabled
```

5. Set up Database

```
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

CREATE USER cs4211_admin WITH PASSWORD '{{db_password}}';
CREATE DATABASE cs4211 OWNER cs4211_admin;
\c cs4211
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO cs4211_admin;
\q
```

Edit C:\Program Files\PostgreSQL\18\data\postgresql.conf:

```
listen_addresses = '*'
```

Edit C:\Program Files\PostgreSQL\18\data\pg_hba.conf, add at the end:

```
host    all             all             0.0.0.0/0               scram-sha-256
```

Restart Postgres:

```
Restart-Service postgresql-x64-18
```

6. Deploy App Files
   - Build locally on Mac: cd server && ppnpm build && cd ..
   - In Microsoft Remote Desktop, edit connection > Folders > redirect local dist folder
   - Connect via RDP and copy files to C:\Users\Administrator\Desktop\cs4211
   - Files needed: index.cjs, package.json, node_modules/, .env.production

7. Run the App (NSSM)

Install and start:

```
C:\Users\Administrator\Desktop\cs4211\nssm.exe install cs4211 "C:\Program Files\nodejs\node.exe" "C:\Users\Administrator\Desktop\cs4211\index.cjs"
C:\Users\Administrator\Desktop\cs4211\nssm.exe set cs4211 AppDirectory "C:\Users\Administrator\Desktop\cs4211"
C:\Users\Administrator\Desktop\cs4211\nssm.exe set cs4211 AppEnvironmentExtra NODE_ENV=production
C:\Users\Administrator\Desktop\cs4211\nssm.exe start cs4211
```

Set up logs:

```
C:\Users\Administrator\Desktop\cs4211\nssm.exe set cs4211 AppStdout "C:\Users\Administrator\Desktop\cs4211\out.log"
C:\Users\Administrator\Desktop\cs4211\nssm.exe set cs4211 AppStderr "C:\Users\Administrator\Desktop\cs4211\err.log"
C:\Users\Administrator\Desktop\cs4211\nssm.exe restart cs4211
```

Common commands:

```
C:\Users\Administrator\Desktop\cs4211\nssm.exe status cs4211
C:\Users\Administrator\Desktop\cs4211\nssm.exe restart cs4211
C:\Users\Administrator\Desktop\cs4211\nssm.exe stop cs4211
Get-Content "C:\Users\Administrator\Desktop\cs4211\out.log" -Tail 100
Get-Content "C:\Users\Administrator\Desktop\cs4211\err.log" -Tail 100
```

8. CloudFront + SSL
   - ACM cert must be in us-east-1: https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1
   - Request public cert for cs4211-server.tanjingsheng.com, DNS validation
   - Create CloudFront distribution:
     - Origin domain: cs4211-origin.tanjingsheng.com
     - Origin protocol: HTTP only
     - Viewer protocol: HTTPS only
     - Allowed HTTP methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
     - Cache policy: CachingDisabled
     - Alternate domain name: cs4211-server.tanjingsheng.com
     - Custom SSL certificate: select ACM cert from us-east-1

9. Amplify Rewrites

```json
[
  {
    "source": "/api/<*>",
    "status": "200",
    "target": "https://cs4211-server.tanjingsheng.com/api/<*>"
  },
  {
    "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|mjs|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>",
    "status": "200",
    "target": "/index.html"
  }
]
```
