CREDIT CONNECT HUB v3

Що додано:
- Meta Pixel ID 1629476742086530 (завантажується після згоди на marketing cookies)
- fbclid / fbc / fbp / UTM / campaign IDs
- click_id -> PDL subid
- POST /api/track: серверне збереження кліку, IP та User-Agent
- GET /api/pdl-postback: прийом approved-конверсії PDL
- Meta CAPI Lead з event_id та захистом від повторної відправки

Локальний запуск:
1) Встановіть Node.js 18+.
2) Відкрийте термінал у цій папці.
3) Windows PowerShell:
   $env:META_CAPI_TOKEN="ВАШ_ТОКЕН"
   node server.js
4) Відкрийте http://localhost:3000

ВАЖЛИВО: PDL не зможе викликати localhost. Реальний postback перевіримо після тимчасового або production розміщення в інтернеті.

Майбутній PDL Postback URL після отримання домену:
https://YOUR-DOMAIN/api/pdl-postback?subid={subid}&lead_status={lead_status}&lead_id={lead_id}&transaction_id={transaction_id}&offer_id={offer_id}&aff_rev={aff_rev}

У PDL залишаємо статус: approved.

META_CAPI_TOKEN не записаний у файли проєкту. Він передається серверу через environment variable.
