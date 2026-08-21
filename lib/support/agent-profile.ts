/**
 * Identity of the support widget's AI persona.
 *
 * The avatar URL was pasted into components/support/floating-support-widget.tsx
 * five times -- FAB, header, every incoming bubble, the typing indicator -- so
 * changing it meant finding all five. The display name was written out in eight
 * separate string literals.
 */

/** Avatar shown for the AI agent and for live human agents. */
export const SUPPORT_AGENT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"

/** The persona's display name. */
export const SUPPORT_AGENT_NAME = "Moureen Tyler"

/** Subtitle under the name in the widget header. */
export const SUPPORT_AGENT_ROLE = "TOLA Digital Agent"
