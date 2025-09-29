export type GroupRole = 'admin' | 'owner' | 'member';

export interface GroupMemberWithRole {
  member: {
    userId: string;
    groupId: string;
  };
  role: GroupRole | null;
}

export const isValidGroupRole = (role: string | null): role is GroupRole | null => {
  if (role === null) return true;
  return ['admin', 'owner', 'member'].includes(role);
};
