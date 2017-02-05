# GovnokoderBot
The chat bot for Telegram

# Config
Создайте файл `.env` и добавьте в него переменные:
```
BOT_TOKEN=
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=
```
# Docker
Сборка контейнера
```
docker build -t {your_name}/govnokoder .
```
Запуск контейнера
```
docker run --env-file .env -d {your_name}/govnokoder
```
