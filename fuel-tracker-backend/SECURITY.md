# Security Best Practices

## Dependencies Audit

### Regular Checks

Регулярно проверяйте зависимости на уязвимости:

```bash
# Python dependencies audit (рекомендуется раз в месяц)
pip list --outdated
pip-audit  # Требует установки: pip install pip-audit

# Docker image security scan
docker scan fuel-tracker-backend

# Trivy (альтернатива)
trivy image fuel-tracker-backend
```

### Automated Monitoring

Рекомендуется настроить автоматический мониторинг через:
- **GitHub Dependabot** (автоматические PR с обновлениями)
- **Snyk** (сканирование уязвимостей)
- **PyUp** (Python-specific dependency monitoring)

### Critical Dependencies

Особое внимание уделять:
- **Django** - веб-фреймворк (критичные security updates)
- **psycopg2** - PostgreSQL драйвер
- **redis** - кэширование
- **djangorestframework** - API framework

### Update Policy

1. **Security updates**: Применять немедленно
2. **Minor updates**: Тестировать и применять ежемесячно
3. **Major updates**: Планировать и тестировать перед применением

## Password Security

- Минимальная длина: 8 символов
- Django validators:
  - UserAttributeSimilarityValidator (не похож на email/username)
  - CommonPasswordValidator (не из списка популярных паролей)
  - NumericPasswordValidator (не только цифры)

## Session Security

- Session lifetime: 1 час (3600 секунд)
- HttpOnly cookies (защита от XSS)
- SameSite=Lax (защита от CSRF)
- Secure cookies в production (только HTTPS)

## Rate Limiting

- Authentication endpoints: 5 req/min
- Anonymous users: 100 req/hour
- Authenticated users: 1000 req/hour

## Account Lockout

- 5 неудачных попыток входа → блокировка на 15 минут
- Логирование всех failed attempts с IP адресами

## Input Validation

- XSS sanitization через `bleach` library
- Максимальная длина всех текстовых полей
- Валидация на уровне serializers и моделей

## Logging

- Correlation ID для всех запросов
- Request/Response logging (БЕЗ sensitive data)
- Security events в отдельный лог (`logs/security.log`)

## Production Checklist

- [ ] `DEBUG=False`
- [ ] Уникальный `SECRET_KEY` (>50 символов)
- [ ] `ALLOWED_HOSTS` указаны явно
- [ ] `CORS_ALLOWED_ORIGINS` whitelist
- [ ] SSL/HTTPS настроен
- [ ] Security headers (HSTS, CSP, X-Frame-Options)
- [ ] Database backups настроены
- [ ] Monitoring и alerting

## Incident Response

При обнаружении security инцидента:

1. **Изолировать**: Отключить затронутый сервис
2. **Оценить**: Определить масштаб утечки/компрометации
3. **Уведомить**: Пользователей (если их данные затронуты)
4. **Исправить**: Применить патч/фикс
5. **Документировать**: Post-mortem анализ
6. **Предотвратить**: Обновить процессы/тесты

## Contact

Security issues: security@example.com

