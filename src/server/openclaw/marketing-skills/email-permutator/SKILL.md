---
name: email-permutator
description: When the user wants to generate variations of email addresses from a first and last name. Use when they ask for "guess emails," "email permutations," "find the email," "firstname variations," or "email address guessing." Useful for finding the right email contact when discovery returns a partial/uncertain result.
metadata:
  version: 1.0.0
---

# Email Permutator

Generate common email variations from first name + last name + company domain.

## When to Use

After discovering a prospect by name, but you're not 100% sure of the email format:

- Prospect: "John Smith" at TechCorp (domain: techcorp.com)
- Uncertain which: john@techcorp.com, j.smith@techcorp.com, jsmith@techcorp.com?

**This skill generates all common variations**, then you can:
1. Test which one exists (via email-validation heuristics)
2. Manually check company directory (LinkedIn, company site)
3. Use Mailmeteor confidence scores to pick the best

## Common Patterns

| Pattern | Example |
|---------|---------|
| firstname@company.com | john@techcorp.com |
| f.lastname@company.com | j.smith@techcorp.com |
| firstname.lastname@company.com | john.smith@techcorp.com |
| firstnamelastname@company.com | johnsmith@techcorp.com |
| f.l@company.com | j.s@techcorp.com |
| flastname@company.com | jsmith@techcorp.com |
| first.last@company.com | john.smith@techcorp.com |
| firstname_lastname@company.com | john_smith@techcorp.com |

## How It Works

**Input:**
- Prospect name: "John Smith"
- Company: "TechCorp"
- Domain: "techcorp.com"

**Output (ordered by likelihood):**
1. john.smith@techcorp.com (most common; 40% probability)
2. john@techcorp.com (common; 20%)
3. jsmith@techcorp.com (common in tech; 15%)
4. johnsmith@techcorp.com (less common; 10%)
5. j.smith@techcorp.com (less common; 8%)
6. john_smith@techcorp.com (older systems; 5%)
7. Others (rare)

## Integration with Lead Batch

**Workflow:**
1. `lead-batch-create` discovers: "John Smith, TechCorp"
2. `email-permutator` generates variations
3. You test with email-validation heuristics OR Mailmeteor
4. Pick the most likely one
5. Add to CRM

## Tips

- **Order matters:** Check most common patterns first (saves time)
- **Industry matters:** Tech companies often use firstname.lastname; finance uses firstname_lastname
- **Test intelligently:** Use heuristics to check for MX records on domain first
- **Mailmeteor combo:** If using Mailmeteor's UI, paste permutations in and use its confidence scoring
