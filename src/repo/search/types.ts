export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface SearchExample {
  id: string;
  title: string;
}

export interface SearchExamplesResponse {
  examples: SearchExample[];
}
