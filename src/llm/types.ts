export interface Model {
  id: string;
  /** Human-readable name when the API gives one; otherwise the id. */
  name: string;
}

export interface CompleteRequest {
  model: string;
  system: string;
  input: string;
  signal?: AbortSignal;
}

export interface CompleteResult {
  text: string;
  /** The model hit its output limit; the text is incomplete. */
  truncated: boolean;
}

export interface Provider {
  /** Shown in the UI, e.g. in the model list's search bar. */
  label: string;
  /** Models the API key can use. Feeds the model picker. */
  listModels(): Promise<Model[]>;
  /** Runs one prompt over the input and returns the rewritten text. */
  complete(request: CompleteRequest): Promise<CompleteResult>;
}

export interface ProviderConfig {
  label: string;
  apiKey: string;
  /** Without trailing slash. */
  baseUrl: string;
}
