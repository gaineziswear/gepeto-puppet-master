class ProviderGateway {
  constructor() {
    this.providers = {
      openai: { enabled: !!process.env.OPENAI_API_KEY, key: process.env.OPENAI_API_KEY },
      anthropic: { enabled: !!process.env.ANTHROPIC_API_KEY, key: process.env.ANTHROPIC_API_KEY },
      google: { enabled: !!process.env.GOOGLE_API_KEY, key: process.env.GOOGLE_API_KEY },
      xai: { enabled: !!process.env.XAI_API_KEY, key: process.env.XAI_API_KEY },
      mistral: { enabled: !!process.env.MISTRAL_API_KEY, key: process.env.MISTRAL_API_KEY }
    };
  }

  getProviderForResident(resident) {
    const provider = resident?.provider || 'OpenAI';
    const normalized = provider.toLowerCase();
    const config = this.providers[normalized] || this.providers.openai;
    return { provider, normalized, config };
  }

  getStatus() {
    return Object.fromEntries(Object.entries(this.providers).map(([key, value]) => [key, value.enabled ? 'healthy' : 'simulated']));
  }

  generateResidentResponse({ resident, topic }) {
    const topicText = topic || 'Should democratic systems adapt to AI-driven governance?';
    if (!resident) {
      return `The villa simulation notes the conversation topic: ${topicText}.`;
    }

    const providerInfo = this.getProviderForResident(resident);
    const safeFallback = `The resident ${resident.name} is a fictional AI persona configured through ${providerInfo.provider}. ${resident.role} responds to the question: ${topicText}. The platform is preserving character consistency and a transparent model-provider boundary while the backend remains compatible with real provider APIs.`;

    if (!providerInfo.config.enabled) {
      return safeFallback;
    }

    return `${resident.name} (${providerInfo.provider}) argues: ${topicText}. The resident preserves a consistent identity and updates their position according to their programmed character logic while remaining explicitly separate from a real human person.`;
  }
}

module.exports = { ProviderGateway };
