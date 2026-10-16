# GLOBAL — Website project

This repository stores the source code and project notes for Akmal's GLOBAL education lead-generation website.

## Current deployment

- Hosting: Cloudflare Workers
- Telegram application notifications: enabled through the Cloudflare secret `TELEGRAM_BOT_TOKEN`
- Do not put the Telegram bot token in this repository or in source code.
- Keep the existing Cloudflare Worker live until a replacement is reviewed and tested.

## Agreed website requirements

- Temporary brand: GLOBAL (final name will be chosen later)
- Slogan: «Твоя следующая точка — весь мир.»
- Premium, trustworthy, mobile-first design
- Lead capture for school pupils, students, graduates, parents, and working adults; no upper age limit
- Programs start from $5,000
- Application form sends leads to Telegram
- 22 countries and 169+ partner universities, using the country counts provided by Akmal
- Add a dedicated 11th-grade section explaining parallel study over 6–9 months while finishing school. Avoid guaranteeing admission; say the student can apply after completing the relevant requirements.
- Email will be added later, once the address is decided
- Contact phones: +998 93 069 44 19 and +998 93 600 44 11

## 11th-grade section — agreed draft

**Ты учишься в 11 классе?**

Не жди окончания школы — начни обучение уже сейчас.

Пока ты заканчиваешь 11 класс, параллельно проходишь нашу программу 6–9 месяцев. После окончания получаешь аттестат и сертификат о пройденном обучении и можешь подавать документы на обучение за рубежом.

**22 страны · 169+ университетов**

**Начни сейчас — не теряй целый год.**

Button: «Узнать о программе» (scrolls to the application form).

## Before deploying a replacement

1. Review the current live Worker code before changing it.
2. Keep the Telegram integration using `env.TELEGRAM_BOT_TOKEN`; never commit a real token.
3. Test the form and Telegram notification.
4. Deploy to Cloudflare only after review.
5. Keep this repository as a backup/source of truth.
