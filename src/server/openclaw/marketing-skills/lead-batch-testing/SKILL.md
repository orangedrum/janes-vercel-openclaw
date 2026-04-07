---
name: lead-batch-testing
description: When the user wants to analyze cold email campaign results and optimize the next batch. Use when they ask for "batch results," "email performance," "campaign feedback," "what worked," "improve subject line," "analyze responses," "testing feedback," or "next email version." This skill connects campaign metrics to market signals and uses A/B testing principles to recommend copy improvements.
metadata:
  version: 1.0.0
---

# Lead Batch Testing & Optimization

You help analyze the results of 100-email cold outreach batches and use those results to optimize the next batch.

## Before Starting

**Ask for:**
1. Previous batch Template_ID (e.g., "BATCH-001-RUN-1")
2. Date the batch was sent
3. Subject line that was used
4. Email body that was used
5. Results from that batch:
   - Number of warm responses
   - Number of meeting requests
   - Number of redirects
   - Number of unsubscribes
   - Bounce rate (%)

**If the user mentions market signals or CRM:**
- Ask them to share the "Market Signals" tab from their CRM
- This usually contains competitive activity, buyer intent signals, and open roles
- Use this context to inform why the previous batch performed as it did

## Analysis Framework

### Step 1: Calculate Performance Metrics

From the raw numbers, compute:

| Metric | Formula | Benchmark |
|--------|---------|-----------|
| Response Rate | (warm responses + meeting requests) / 100 | 3-5% is good for cold |
| Meeting Rate | meeting requests / 100 | 1-2% is strong |
| Unsubscribe Rate | unsubscribes / 100 | <1% desired |
| Bounce Rate | % provided | <2% is good; >5% signals list quality issue |
| Redirect Rate | redirects / 100 | 2-5% typical; high = bad targeting |

### Step 2: Diagnose the Previous Batch

**If response rate < 1%:**
- Subject line likely too generic or salesy ("Save 40% this month!")
- Body lacks personalization hooks
- Targeting may be off (wrong title, wrong industry)
- Recommendation: increase personalization depth, add specific pain point

**If response rate 1-3%:**
- Decent baseline; subject line or opening statement needs sharpening
- Body might be too long or unclear on the ask
- Meeting requests low = CTA unclear or value prop weak

**If response rate 4-7%:**
- Strong performance; maintain the formula
- Test micro-variations (subject line only, or CTA only)

**If unsubscribe rate > 2%:**
- Subject line perceived as clickbait or misleading
- Body overselling or not matching subject promise
- Or: list quality issue (too many tire-kickers, wrong role)

**If bounce rate > 5%:**
- List quality problem (invalid emails, company closed)
- Should rerun email-validation skill on remaining list
- May explain low response (if 20% bounced, true response rate is higher than shown)

**If redirect rate > 8%:**
- Targeting is correct (people are passing you around) but email isn't hitting the right person
- Recommendation: add "also cc:" or "if not you, who owns [problem]?" to body

### Step 3: Apply A/B Testing Principles

Use concepts from the A/B test framework:

1. **Change only ONE variable:**
   - **Subject line test**: keep body the same, only change the subject
   - **Opening test**: same subject, different hook/pain point in first line
   - **CTA test**: same everything, different call-to-action
   - Avoid changing multiple things at once

2. **Hypothesis:** "Because [observation from last batch], we believe [change] will cause [outcome]."
   - Example: "Because the bounce rate was 3%, we believe people are harder to find at big companies AND the role is changing. We will test a 'find the new person' micro-CTA."

3. **Outcome metric:** What will you measure?
   - Response rate? Meeting rate? Redirect rate?

### Step 4: Generate Improved Copy

Based on the diagnosis, recommend:

1. **New Subject Line (2-4 variations)**
   - If previous was too salesy: make it internal-looking, specific to job change/pain
   - If previous was too generic: add a specific proof point or data
   - Include psychological persuasion (scarcity "time-sensitive," social proof "3 similar companies," curiosity "one thing we found")

2. **New Email Body (1 primary version)**
   - **Opening:** Reference market signal (new funding, role change, competitor announcement) or specific pain from research
   - **Middle:** Single specific value statement, not features
   - **CTA:** Micro-ask (not "let's chat," but "one quick question: does your team own X?")
   - **Length:** Shorter than before if previous was long; add whitespace

3. **Personalization Hook Suggestions**
   - If "AI personalization" column was weak, suggest better angles based on market signals

### Step 5: A/B Test Plan

**Recommend a split for the next 100:**
- 50 with NEW subject line (same body)
- 50 with new subject line + new body

If previous batch response was very low (<1%), can do:
- 40 new subject + old body (isolate subject impact)
- 40 new subject + new body
- 20 keep old (control)

### Template Output

```markdown
## Batch Analysis: [Template_ID] / [Send Date]

### Metrics
| Metric | Result | Benchmark | Status |
|--------|--------|-----------|--------|
| Response Rate | X% | 3-5% | ✅ or ⚠️ or ❌ |
| Meeting Rate | X% | 1-2% | |
| Bounce Rate | X% | <2% | |
| Unsubscribe Rate | X% | <1% | |
| Redirect Rate | X% | 2-5% | |

### Diagnosis
[1-2 sentence summary of what worked and what didn't]

**Key Finding:** [The ONE thing to fix]

### Hypothesis for Next Batch
"Because [observation], we believe [change] will cause [improvement]."

### Recommended New Subject Lines
1. "[Subject A]" — *angle: [specific persuasion tactic]*
2. "[Subject B]" — *angle: [different tactic]*
3. "[Subject C]" — *angle: [third angle]*

### Recommended Email Body
[New email version with opening → middle → CTA structure]

### Next Batch Test Plan
- **50 emails:** New subject line + old body (isolate subject)
- **50 emails:** New subject line + new body (full optimization)

**Template_ID for next batch:** [BATCH]-001-RUN-2

### Market Signal Insights
Based on the CRM signals you shared:
- [Insight 1 related to response performance]
- [Insight 2 related to redirect rate]
```

---

## Tips

- **Cold email benchmarks vary by industry.** B2B SaaS typically sees 2-5% response; enterprise sales can be <1%; agencies can hit 8-15% with strong personalization.
- **Bounces are better than silence.** If 5% bounced but 3% responded, your true response rate is 3/(100-5) = 3.2% on valid emails — not bad.
- **One variable at a time.** This is the only way to know what actually moved the needle.
- **Market signals matter.** If a prospect's company just raised funding or fired a competitor, mention it. That context often explains response rate better than copy alone.
