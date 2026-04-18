# MCP Thais Node.js Streamable HTTP Toolkit

A production-style local MCP server in Node.js that connects LLM agents (Claude Desktop, ChatGPT via bridge) to the ThaIs Hotel partner API.

This project started as a technical assignment and was fully refactored into a portfolio-grade implementation: cleaner architecture, safer defaults, stronger docs, and explicit MCP tool design.

The original assignment statement is archived at `docs/original-assignment.pdf`.

## Features

- Streamable HTTP MCP transport (`/mcp`)
- Natural language parsing for availability requests in French
- Room availability on date ranges
- Room type listing and detailed room type lookup
- Pricing retrieval by `roomTypeId` and `rateId`
- E-reservation payload creation (`dryRun` by default)
- Debug endpoints for controlled local checks

## Tech Stack

- Node.js 20+
- Express 5
- Model Context Protocol SDK
- Zod schemas for MCP tool arguments

## Architecture

```text
src/
  index.js                 # app bootstrap
  app.js                   # HTTP app + routes mounting
  debug/routes.js          # debug endpoints
  mcp/
    server.js              # MCP server + tool registration
    transport.js           # Streamable HTTP transport
    tools/                 # MCP tool definitions
  domain/                  # business logic services
  thais/                   # API client + endpoint wrappers
  utils/                   # shared utilities
```

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env
```

3. Start server:

```bash
npm run start
```

Server endpoints:

- `POST /mcp`
- `GET /health`
- `GET /debug/check`
- `GET /debug/tool`

## MCP Tools

- `thais_check_availability`
- `thais_list_room_types`
- `thais_get_room_details`
- `thais_get_room_details_bulk`
- `thais_list_rate_ids`
- `thais_get_pricing`
- `thais_create_e_reservation`

## Example Prompts

- `Y a-t-il une chambre disponible pour 2 personnes du 6 au 12 fevrier 2026 ?`
- `Liste les types de chambres publics.`
- `Donne-moi le tarif du room type 5 du 2026-02-10 au 2026-02-12 pour 2 adultes.`

## Development

- `npm run dev` to run with file watch
- `npm test` to run unit tests

## API Credentials

The sample `.env.example` uses publicly documented demo credentials from the assignment context. For production or private use, always replace them with environment-specific secrets.

## Professional Scope

This repository is maintained as a personal portfolio project and is intentionally company-neutral.

## License

MIT
