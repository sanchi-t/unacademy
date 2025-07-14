# Project Overview

This is a backend Node.js Express server for RESTful e-commerce APIs.

## Features

- Provides caching for faster results
- Includes tests to validate functionality
- Error handling
- Performance metrics

## Getting Started

Clone the repository and follow the setup instructions in the documentation to get started.

- Run `npm install`
- Start Redis server
- Start database instance
- Run `docker compose up -d`
- Start the server with `node server`

## Grafana Queries

```
sum by (cache_status) (
  avg_over_time(http_request_duration_ms_sum[1m])
)
/
sum by (cache_status) (
  avg_over_time(http_request_duration_ms_count[1m])
)

```

```
sum by (method, route, cache_status) (http_request_duration_ms_sum)
/
sum by (method, route, cache_status) (http_request_duration_ms_count)

```
