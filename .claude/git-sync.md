# Git Sync Workflow - Mind Galaxy

Quick sync commands for seamless work between PC and Phone.

## Start Work Session
```bash
# Pull latest changes from remote
git pull origin main
```

## View Changes Before Committing
```bash
# See what changed
git status

# View detailed line changes
git diff
```

## Save & Sync Work
```bash
# Stage all changes
git add .

# Commit with message
git commit -m "feat: describe your changes here"

# Push to remote (accessible on all devices)
git push origin main
```

## Quick One-Liner Sync
```bash
# Pull, commit everything, and push
git pull origin main && git add . && git commit -m "sync: work in progress" && git push origin main
```

---

**Claude Automation Command:** When user says "sync my work" or "git sync", execute the Quick One-Liner Sync above.
