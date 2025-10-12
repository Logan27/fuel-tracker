# GitHub Setup Instructions

## Создание репозитория на GitHub

### Шаг 1: Создайте новый репозиторий на GitHub

1. Откройте https://github.com/new
2. Заполните форму:
   - **Repository name**: `fuel-tracker`
   - **Description**: `MVP приложение для отслеживания расхода топлива транспортных средств`
   - **Visibility**: Public или Private (на ваш выбор)
   - **НЕ выбирайте**: "Initialize this repository with a README" (у нас уже есть коммит)
   - **НЕ добавляйте**: .gitignore, license (они уже есть в проекте)
3. Нажмите **"Create repository"**

### Шаг 2: Подключите локальный репозиторий к GitHub

После создания репозитория GitHub покажет инструкции. Используйте команды для **existing repository**:

```bash
# Добавьте remote (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/fuel-tracker.git

# ИЛИ используйте SSH (если настроен):
git remote add origin git@github.com:YOUR_USERNAME/fuel-tracker.git

# Переименуйте ветку в main (если хотите использовать main вместо master)
git branch -M main

# Push в GitHub
git push -u origin main
```

### Шаг 3: Проверьте результат

Откройте https://github.com/YOUR_USERNAME/fuel-tracker и убедитесь, что все файлы загружены.

---

## Альтернативный способ: Использование GitHub CLI

Если хотите использовать GitHub CLI для автоматизации:

### Установка GitHub CLI (Windows)

```powershell
# Через winget
winget install --id GitHub.cli

# ИЛИ скачать с https://cli.github.com/
```

### Создание репозитория через CLI

```bash
# Авторизация
gh auth login

# Создание репозитория и push
gh repo create fuel-tracker --public --source=. --remote=origin --push

# ИЛИ для private репозитория
gh repo create fuel-tracker --private --source=. --remote=origin --push
```

---

## Текущее состояние

✅ Git репозиторий инициализирован  
✅ Все файлы добавлены в commit  
✅ Initial commit создан:
   - 291 файлов
   - 38,558 строк кода
   - Backend (Django REST Framework)
   - Frontend (React + Vite + Zustand)
   - Документация
   - Тесты (91% coverage)
   - Security fixes (15 уязвимостей исправлено)

⏳ Ожидает push в GitHub

---

## Что входит в репозиторий

### Backend
- Django REST Framework API
- PostgreSQL database models
- Redis caching
- Session-based authentication
- Security fixes (XSS, CSRF, Brute Force protection)
- 55 automated tests
- API documentation (Swagger/ReDoc)

### Frontend
- React + TypeScript
- Vite build tool
- Zustand state management
- TanStack Query for server state
- shadcn/ui components
- Responsive design
- E2E tests (Playwright)

### Documentation
- `docs/brd.md` - Business Requirements
- `docs/arch.md` - Architecture
- `docs/rest-api.md` - API Specification
- `docs/security-audit.md` - Security Audit Report
- `docs/test-cases.md` - Test Cases
- `docs/roadmap.md` - Development Roadmap

### Infrastructure
- Docker Compose setup
- Environment configuration examples
- Security best practices (`SECURITY.md`)
- Comprehensive .gitignore

---

## После push в GitHub

### Рекомендуемые настройки репозитория:

1. **Branch Protection Rules** (Settings → Branches):
   - Require pull request reviews
   - Require status checks to pass
   - Include administrators

2. **Security**:
   - Enable Dependabot alerts
   - Enable Dependabot security updates
   - Enable Secret scanning

3. **GitHub Actions** (опционально):
   - CI/CD pipeline для автоматических тестов
   - Автоматический деплой

4. **README.md**:
   - Добавить badges (build status, coverage)
   - Screenshots приложения
   - Live demo link (если есть)

---

## Полезные команды Git

```bash
# Проверить статус
git status

# Посмотреть историю коммитов
git log --oneline

# Посмотреть удалённые репозитории
git remote -v

# Push изменений
git push

# Pull изменений
git pull

# Создать новую ветку
git checkout -b feature/new-feature

# Переключиться на ветку
git checkout main

# Слить ветку
git merge feature/new-feature
```

---

## Troubleshooting

### Ошибка: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/fuel-tracker.git
```

### Ошибка: "failed to push some refs"
```bash
# Если remote репозиторий не пустой, сделайте pull с --allow-unrelated-histories
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Ошибка: "Permission denied (publickey)"
Используйте HTTPS вместо SSH или настройте SSH ключи:
https://docs.github.com/en/authentication/connecting-to-github-with-ssh

