# Notepipe Distribution Guide

**Target:** Solo founders and small sales teams (1-5 people) who do their own sales calls and manually update their CRM after meetings.

**Budget:** Zero. Time-constrained (nights & weekends).

**Core insight:** Your target customer already knows the pain. They just finished a sales call, they're staring at HubSpot, and they're thinking "I really don't want to type all this in." You don't need to explain the problem — you need to show up where they're already complaining about it.

---

## Phase 1: Get Your First 10 Users (Week 1-4)

### 1. Ship a landing page with a waitlist

Before anything else, you need a URL to send people to. Your current landing page at notepipe.ai works. Add:

- A clear one-liner: "Your meeting notes flow into your CRM automatically"
- A 30-second Loom demo showing: record call -> Notepipe extracts data -> appears in HubSpot
- An email signup / "Get Early Access" button (use Supabase magic link — you already have it)

**Don't overthink this.** A Loom video is more convincing than any polished marketing site at this stage.

### 2. Go where the pain is being discussed

**Reddit (your strongest free channel):**
- r/sales (958k members) — people complain about CRM data entry weekly
- r/salesforce, r/hubspot — people asking about automation
- r/startups, r/SaaS — founders sharing tools
- r/Entrepreneur — solo founders doing sales themselves

**How to post without getting banned:**
- Don't post "check out my tool." That gets deleted.
- Post value-first: "I built a script that auto-fills HubSpot after every sales call — here's how it works" with a technical breakdown
- Share the pain: "I was spending 20 min after every call updating my CRM. Built something to fix it."
- Reply to existing threads where people ask about Fireflies integrations, CRM automation, or meeting note tools
- Only mention Notepipe naturally in comments or as an edit after engagement

**Best Reddit post formats that work:**
- "I built X to solve Y" (build-in-public style, r/SaaS loves these)
- "How I automated my post-meeting CRM workflow" (tutorial-style, r/sales)
- "Show HN"-style launch on r/startups

### 3. X (Twitter) strategy

Your X account is useful but only if you're consistent. The playbook:

**Week 1-2: Build in public**
- Tweet about building Notepipe: "Day 1: Building an app that auto-fills your CRM after sales calls. Here's the stack..." (devs follow, some are also founders doing sales)
- Share screenshots of the UI, the extraction results, the before/after in HubSpot
- Use hashtags: #buildinpublic #indiehackers #saas #salestech

**Week 3+: Pain-point content**
- "Sales reps spend 5.5 hours/week on CRM data entry (Salesforce study). That's 286 hours/year of copy-pasting meeting notes."
- "Your AI meeting recorder already has the data. Why are you still typing it into HubSpot manually?"
- Short-form tips: "3 things that should happen automatically after every sales call"

**Engagement hacks:**
- Reply to people tweeting about Fireflies, Otter, HubSpot, Pipedrive. Don't pitch — just add value.
- Follow and engage with: @fireabordi (Fireflies CEO), HubSpot community people, indie SaaS founders
- Quote-tweet Fireflies posts with "Love this — we built Notepipe to take it one step further and push the extracted data straight into your CRM"

### 4. Direct outreach (highest conversion, lowest scale)

Find 20 people who fit your target profile and DM them:

- People who tweeted about Fireflies + CRM pain
- People on r/sales asking about post-meeting workflows
- Founders in indie hacker communities (IndieHackers.com, Twitter #buildinpublic)

**DM template:**
> Hey [name], saw your post about [specific thing]. I'm building a tool that automatically extracts contacts, companies, and action items from your meeting recordings and writes them to HubSpot/Pipedrive. Would you be up for trying the beta? It's free — I just need feedback.

**Why this works:** You're not selling. You're asking for help. Founders and small team operators love giving feedback on early products if you're genuine about it.

---

## Phase 2: Get to 50 Users (Month 2-3)

### 5. Fireflies community & integrations page

Fireflies has an integrations/apps ecosystem. Getting listed there (even informally) puts you in front of every Fireflies user looking for CRM integrations.

- Email Fireflies partnerships/support: "We built a Fireflies -> CRM integration that auto-creates contacts and notes in HubSpot/Pipedrive after every meeting. Would love to be listed on your integrations page."
- Post in Fireflies' community/help channels about the integration
- Write a blog post or guide: "How to automatically push Fireflies transcripts to HubSpot" and share it in Fireflies communities

### 6. Content that ranks (SEO, slow but compounding)

Write 3-5 blog posts targeting searches your customers actually make:

- "How to automatically add Fireflies meeting notes to HubSpot"
- "Best Fireflies CRM integrations [2026]"
- "How to automate CRM data entry after sales calls"
- "Fireflies webhook setup guide" (you literally built this — document it)

Put these on your site (notepipe.ai/blog) or on Medium/Dev.to if you don't have a blog yet. Medium ranks fast on Google.

### 7. IndieHackers & Product Hunt

**IndieHackers:**
- Post a "Show IH" with your story, revenue (even $0 MRR), and learnings
- Engage in the Sales/CRM and SaaS groups
- Post monthly revenue updates (people love following $0 -> $X journeys)

**Product Hunt:**
- Prep a launch: good tagline, 3-4 screenshots, a Loom demo
- Get 5-10 friends to upvote at launch (don't buy votes)
- Best day to launch: Tuesday or Wednesday
- This alone can drive 200-500 signups if done well

### 8. Partnerships with complementary tools

Reach out to:
- Other Fireflies integration builders
- CRM consultants / HubSpot agency partners (they set up tools for clients)
- Sales coaching tools, sales enablement tools
- Meeting note tools that don't do CRM integration yet

Offer: "We integrate with your tool. Want to co-promote?" or "Can we write a guest post about using [their tool] + Notepipe together?"

---

## Phase 3: Monetization & Growth (Month 3+)

### 9. Pricing strategy

**For your target (solo founders, small teams), keep it simple:**

| Plan | Price | Includes |
|------|-------|----------|
| Free | $0 | 10 meetings/month, 1 CRM connection |
| Pro | $19/mo | Unlimited meetings, all CRMs, priority processing |
| Team | $49/mo | Up to 5 users, shared templates, team dashboard |

**Why this works:**
- Free tier gets people in the door and builds word-of-mouth
- $19/mo is an impulse purchase for anyone doing sales ("saves me 5 hours/month")
- Don't launch with pricing too early — get 20-30 active users first, then introduce paid plans

### 10. Retention > acquisition

**The easiest growth is keeping people who already signed up.**

- Send a weekly email: "Notepipe processed 12 meetings this week. 8 contacts created, 12 notes attached." (value reinforcement)
- Alert on failures: "Your HubSpot connection expired — reconnect to keep your pipeline updated"
- Monthly summary: "You saved approximately 3.5 hours this month by automating CRM entry"

---

## Metrics That Matter

Track these from day 1:

| Metric | Target | Why it matters |
|--------|--------|----------------|
| Signups | 10/week | Top of funnel |
| Activation (first successful run) | 40% of signups | Are people actually using it? |
| Weekly active users | Growing week-over-week | Retention signal |
| Runs per user per week | 3+ | Usage depth |
| NPS or qualitative feedback | "I'd be disappointed if this went away" | Product-market fit |

**The #1 metric early on: how many people complete their first successful run?** If people sign up but never get a meeting processed, your onboarding is broken, not your distribution.

---

## Quick Wins Checklist

Do these this week:

- [ ] Record a 30-second Loom demo and put it on your landing page
- [ ] Write one Reddit post in r/sales or r/SaaS (build-in-public style)
- [ ] Tweet about what you're building with a screenshot (use #buildinpublic)
- [ ] DM 5 people who've tweeted about Fireflies + CRM pain
- [ ] Set up a simple analytics tracker (Plausible, PostHog free tier, or just Supabase queries on your runs table)

---

## What NOT To Do

- **Don't buy ads yet.** At zero budget with no proven conversion funnel, paid ads burn money.
- **Don't build more features before getting users.** You have Fireflies + HubSpot + Pipedrive + Attio + Zoho + file upload. That's more than enough for v1.
- **Don't spend weeks on a perfect landing page.** A Loom video and an email signup beats a polished site with no traffic.
- **Don't wait until it's "ready."** It's ready enough. Ship it, get feedback, iterate.
- **Don't spam.** One genuine, valuable post beats 10 self-promotional ones. Communities remember who adds value vs. who just promotes.

---

## Resources

- [How to get your first 10 customers](https://www.lennysnewsletter.com/p/how-to-kickstart-and-scale-a-marketplace) — Lenny Rachitsky
- [The Mom Test](http://momtestbook.com/) — How to talk to customers without wasting time
- [Product Hunt launch checklist](https://blog.producthunt.com/how-to-launch-on-product-hunt-7c1843e06399)
- [r/sales](https://reddit.com/r/sales) — Your #1 community channel
- [IndieHackers](https://indiehackers.com) — Post your journey, get feedback
