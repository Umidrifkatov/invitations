FROM python:3.12-slim


# Set the working directory
WORKDIR /app

# Copy dependencies file
COPY requirements.txt ./

# Install dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the application code
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose the application port
EXPOSE 8000

# Run the Django application
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]