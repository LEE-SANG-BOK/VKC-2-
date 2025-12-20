export type HiddenTargetType = 'post' | 'answer' | 'comment';

export interface HiddenTargetsResponse {
  ids: string[];
}

export interface HideTargetPayload {
  targetType: HiddenTargetType;
  targetId: string;
}
