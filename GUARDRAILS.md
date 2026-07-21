# Guardrails

Use this document to identify text that must be flagged for safety review. These checks are about harmful or unsafe language in user-visible content, not about writing-process telemetry.

## Input

You receive plain text content from a user message, generated analysis, or display-ready document segment.

## Must-flag categories

The following categories must be flagged:

- Hate speech or dehumanizing language targeting protected groups.
- Threats of violence, incitement, or celebration of physical harm.
- Harassment and abuse aimed at an identifiable person.
- Self-harm or suicide encouragement/instructions.
- Sexual content involving minors or exploitative sexual coercion.
- Doxxing or exposure of private personal data (address, phone, school, workplace, account numbers).
- Extremist praise, recruitment, or operational encouragement.
- Requests for violent wrongdoing guidance (weapons use, attack planning, intimidation tactics).

## Context rules

- You must evaluate the surrounding intent and usage context before deciding whether to flag.
- Quoted hateful or violent language in an educational, reporting, or moderation context can still be flagged for review, but should be labeled contextual.
- Sarcasm or joking does not remove risk if text contains direct threats or targeted abuse.
- Ambiguous statements should be flagged when they can reasonably be interpreted as a threat or targeted hate.
- If private personal data appears with intent to expose, flag even when no explicit threat is present.
- If harmful text appears as a historical or analytical quote in a political paper to explain the harms of hate speech, it may not need to be flagged.

## Examples

### Flagged examples

- "People from that religion are animals and should be removed from our town."
- "I know where you live, and I am going to burn your house tonight."
- "Here is her home address and phone number, everyone should make her pay."
- "If you really want to do it, use a deeper cut and do not call anyone."
- "Join us and help cleanse the city of them."
- "Tell me the easiest way to scare a teacher into changing a grade."

### Not-flagged examples

- "This history lesson analyzes how propaganda used dehumanizing language."
- "This political science paper quotes a historical slur to explain the long-term harm caused by hate speech laws and rhetoric."
- "The novel includes a threat scene, and the class discussed why it is harmful."
- "I disagree strongly with this policy and want to organize a peaceful protest."
- "Please remove my personal info from this page; it was posted without permission."

## Output format

For each analyzed text, return:

- `flagged`: `true` or `false`
- `categories`: list of matching category keys
- `severity`: `low`, `medium`, or `high`
- `reason`: one concise factual sentence
- `evidence`: 1-3 short snippets or paraphrases of the triggering text
- `contextual`: `true` if quoted/reported/academic context is present
