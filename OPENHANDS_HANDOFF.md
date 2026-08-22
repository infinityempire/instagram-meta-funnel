# Secure Terminal-Agent Handoff

This repository is already included in the private `infinityempire/kids-stories-brand-project` repository under `meta-platform/instagram-meta-funnel/`. Do not create a second public repository and do not paste a GitHub token into a shell command, file, remote URL, issue, or chat.

## Safe clone and update workflow

```bash
gh auth login
gh repo clone infinityempire/kids-stories-brand-project
cd kids-stories-brand-project
git switch main
git pull --ff-only origin main
```

Use the authenticated GitHub CLI or an SSH key already registered with the GitHub account. Do not use embedded `https://TOKEN@github.com/...` remotes. Before any push, run `git status`, inspect the diff, confirm no `.env` file or secret is staged, then use `git push origin main`.

## Operating constraints

The terminal agent may maintain documentation, metadata, tests, analysis, and commit/push approved code. It must not configure production Meta secrets, publish Instagram media, create external accounts, bypass a CAPTCHA or 2FA step, or use browser automation against Instagram. All Instagram communication must remain on the official Meta Graph API route.
