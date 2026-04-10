FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Create data directory for SQLite persistent volume mount
RUN mkdir -p /data

ENV DATABASE_URL=sqlite+aiosqlite:////data/avishag.db

EXPOSE 8000

RUN chmod +x start.sh

CMD ["bash", "start.sh"]
