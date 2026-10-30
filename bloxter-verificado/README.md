# Ganhe seu verificado — Bloxter

Site separado do Bloxter que usa a API `https://bloxter.sbs/api`.

| URL | O que faz |
| --- | --- |
| `/` | Fundo com os elementos, carinha animada + logo se formando, bloco glass "Ganhe seu verificado" (e-mail + senha) |
| `/verification` | Carinha olhando para os lados, "Pesquisando…" → "Verificando seus posts…" (mín. 5 s) e depois o resultado |

## Regra do selo
Em **2 dias diferentes** (fuso America/Sao_Paulo) a pessoa precisa ter:
- **postado** (posts do perfil), e
- **interagido** (comentários + republicações).

Quem cumpre recebe o selo na hora. Quem não cumpre vê o progresso e o "Como fazer".
Curtidas **não** contam: a API do Bloxter não guarda a data da curtida.

## Rodar
```
node server.js            # http://localhost:3000  (Node 18+, sem dependências)
```
Teste sem mexer no Bloxter de verdade:
```
node test/mock-bloxter.js
BLOXTER_BASE=http://localhost:4010 BLOXTER_BOT_KEY=bx_bot_test node server.js
# contas de teste (senha: senha123): maria@x.com (não cumpre), joao@x.com (cumpre), vera@x.com (já verificada), caio@x.com (só comenta)
```

## Publicar na Vercel
Suba a pasta como um projeto novo (já tem `vercel.json`). Variáveis em `.env.example`:
- `BLOXTER_BOT_KEY` — **necessária para contar comentários**. Crie em bloxter.sbs/developers → seu app → Chaves de bot. Sem ela, só republicações contam como interação.
- `BLOXTER_ADMIN_KEY` — opcional. Entrega o selo pela API de administração (`PATCH /api/admin/users/:usuario`). Sem ela o site usa `POST /api/me/verified`, que só funciona com o banner "Seja verificado" ligado em /administracao.
- `REQUIRED_DAYS` (padrão 2) e `TZ_NAME`.

## Segurança
A senha vai só do navegador para o servidor deste site e dele para o Bloxter; não é salva nem registrada. A sessão do Bloxter fica num cookie HttpOnly de 1 hora (`bxv`), fora do alcance do JavaScript. Login limitado a 10 tentativas por minuto por IP.
