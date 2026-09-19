FROM python:3.12-slim

WORKDIR /app

COPY gradio/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend /backend
COPY gradio /app

ENV PYTHONPATH=/backend

EXPOSE 7860

CMD ["python", "app.py"]
