-- Delete group members of Default Groups
DELETE FROM "group_members"
WHERE "groupId" IN (
  SELECT "id" FROM "groups" WHERE "name" = 'Default Group'
);

-- Delete group member roles of Default Groups
DELETE FROM "group_member_roles"
WHERE "groupId" IN (
  SELECT "id" FROM "groups" WHERE "name" = 'Default Group'
);

-- Delete Default Groups
DELETE FROM "groups" WHERE "name" = 'Default Group'; 