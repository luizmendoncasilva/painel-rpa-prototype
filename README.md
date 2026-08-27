# Painel RPA — Protótipo

Frontend standalone do painel de administração dos RPAs (execuções, relatórios, bots,
usuários e um protótipo de KPIs/analytics). Dados ilustrativos e login simplificado —
feito para validar layout e conteúdo com stakeholders, não é o ambiente de produção.

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- Componentes de UI escritos localmente em `src/components/ui/` (Radix UI +
  class-variance-authority + tailwind-merge) — sem depender de nenhum pacote de
  design system externo/privado.

## Rodando localmente

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Login

Qualquer e-mail, senha `123456`.
