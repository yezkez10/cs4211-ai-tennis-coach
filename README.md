# CS4211 Project 4 — AI Sports Coach with LLM & Formal Methods

This project builds an AI Sports Coach that bridges natural language queries with formal verification using the PAT model checker. Unlike traditional LLM chatbots that hallucinate probabilities, the system acts as a tool-using agent: it translates user questions into parametric PCSP# models, runs PAT to compute verified win probabilities, and synthesises the results into actionable coaching advice.

The two core analysis modes are **Reachability** (predicting win probability) and **Sensitivity** (optimising player strategy).

The system is implemented in Node.js and integrates an LLM (GPT-4o) for natural language understanding and tool orchestration, a player statistics database for real match data, and PAT for formal verification. The primary interface is a web chatbot, with a parametric PCSP# tennis tiebreak model at its core that accepts injected player statistics as parameters.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Node.js 20+ and pnpm installed
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

### 3. Place the dataset

Put the CSV at:

```
./data/raw/tennisabstract-v2-combined.csv
```

> This file is not in the repo due to its size (~1.7GB). Obtain it separately from the TA.

### 4. Seed the database (first time only)

```bash
docker compose up postgres
```

Wait until you see `COPY 6421491` in the logs, then `Ctrl+C`. This loads all 6.4M shot records into the `tennis_data` schema and only needs to be done once.

### 5. Start all services

```bash
npm run dev:docker
```

### 6. Set up the application schema

```bash
cd server
npm run db:dev:setup
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
npm run dev:docker
```

No need to re-seed the database unless you run `docker compose down -v`.
