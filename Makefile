.PHONY: install run-backend run-frontend run

install:
	pip install -r requirements.txt
	cd frontend && npm install

run-backend:
	python3 app.py

run-frontend:
	cd frontend && npm run dev

run:
	@echo "🚀 Starting Kratos Quantale System..."
	@echo "Backend: Port 8000"
	@echo "Frontend: Port 5173"
	@make -j2 run-backend run-frontend
