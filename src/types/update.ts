export type UpdateChangelog = Record<string, string[]>;

export interface UpdateCheckResult {
  has_update: boolean;
  latest_version: string;
  current_version: string;
  update_info: string[];
  changelog: UpdateChangelog;
}
