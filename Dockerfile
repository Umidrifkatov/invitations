FROM python:3.9

WORKDIR /app

# Установка зависимостей
COPY requirements.txt .
RUN pip install -r requirements.txt

# Копирование проекта
COPY . .

# Сбор статических файлов
RUN python manage.py collectstatic --no-input

# Запуск gunicorn вместо runserver
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]