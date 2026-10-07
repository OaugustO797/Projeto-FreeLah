# Freelah

Versão publicada: https://freelah-oportunidades.onofreaugusto.chatgpt.site

Este repositório contém a versão web mobile do Freelah construída a partir do PRD.

Aplicação web mobile-first para oportunidades de serviços locais. Uma conta pode publicar e trabalhar.

## Funcionalidades

- Exploração pública, busca, categorias e filtros.
- Entrada com ChatGPT e perfil básico.
- Publicação com revisão, rascunho, edição e cancelamento.
- Interesse único por pessoa e oportunidade.
- Chat por oportunidade e interessado, atualizado a cada dez segundos.
- Contratação e conclusão, com autorização no servidor.
- Expiração automática na leitura.
- Denúncias, bloqueios e moderação para o proprietário do Site.
- Dados persistentes em D1, com migrações Drizzle.

## Desenvolvimento

Requer Node 22.13+ e pnpm 11.19.0. Execute `pnpm install`, `pnpm dev` e `pnpm build`.
A autenticação local de desenvolvimento é fornecida pelo starter; a versão publicada usa autenticação do Sites.

## Verificação

`node node_modules/typescript/bin/tsc --noEmit`

`scripts/smoke-test.ps1` valida regras com identidades de teste contra um Worker **local** em 127.0.0.1:5174. Nunca use esse script contra produção. A autenticação por cabeçalhos é fornecida pelo dispatcher em produção, e não deve ser aceita em um servidor público sem esse limite de confiança.

## Decisões desta versão

O PRD sugeria Expo e PostgreSQL. Esta primeira entrega é uma aplicação web responsiva com React/Vinext e D1 para facilitar acesso por link. Não há binários nativos, pagamentos, biometria, reputação, uploads ou notificações push. O login usa ChatGPT em vez de cadastro próprio com senha.

As oportunidades ilustrativas da home são explicitamente marcadas e não aceitam interesses. Publicações reais são persistidas e compartilhadas entre usuários.

Termos e privacidade são textos iniciais que devem ser refinados junto com a operação do produto. A exclusão de conta ainda não está implementada. A moderação inicial permite retirar oportunidades e arquivar denúncias; não existe um painel administrativo completo.

WebMCP tem uma ferramenta de filtragem com validação de entrada. A verificação em navegador compatível não estava disponível neste ambiente.
