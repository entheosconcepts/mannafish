# Paste this into any other Claude Code session working on MannaFish (Ken, 8 Nov)

```
Ken does not start new chats. MannaFish keeps its memory in the repo, not in the chat, so nothing is lost when a conversation is summarised.

1. Repo: entheosconcepts/mannafish. All the real work is on the branch test-site (it deploys to https://yadamannafishtest.netlify.app). The default branch main is the old live decal shop page. Run first:
   git fetch origin test-site && git checkout -B test-site origin/test-site
   Never push to main and never touch manna-fish.com unless Ken says "push it live". Push only to test-site.
2. Read CLAUDE.md, then docs/NOW.md (one page: just finished, waiting on Ken, next). Nothing else first. Open docs/DECISIONS.md, docs/UPDATES.md or docs/LAUNCH.md only when you need a detail (DECISIONS.md section B lists every open question; do not change a behaviour that is still an open question).
3. Do not ask Ken anything those files already answer. Ken dictates by voice: read for meaning ("manifest" means MannaFish). Keep replies short and plain, say plainly what was not tested, and end every update with only https://yadamannafishtest.netlify.app/
4. Handoff, done by you, quietly, without being asked: at the end of each job update docs/NOW.md (keep it to one page), and add one dated entry to section D of docs/DECISIONS.md (the date, Ken's request in his words, what you did, the commit hash). Commit with git -c user.name="Claude" -c user.email="noreply@anthropic.com" and push to test-site.
5. Never tell Ken a chat is long or that he should start a new one. If the context fills, the system summarises it; the repo files carry on. Ken pays for extra usage, so do not re-read big files you do not need; search them.
6. Never put a secret, a token, a password, a model name or Ken's home address in any file. Secrets live only in Netlify environment variables. Do not modify the Majestic Awards CRM (/home/user/majestic-crm).
```
