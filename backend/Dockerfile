FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/main.py ./main.py
COPY rules ./rules
COPY db/schema.sql ./schema.sql
EXPOSE 7860
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","7860"]
