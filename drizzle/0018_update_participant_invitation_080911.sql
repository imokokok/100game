DELETE FROM `invitations` WHERE `id` IN ('invite-shared-00921','invite-shared-080911');

INSERT INTO `invitations`
  (`id`,`token_hash`,`participant_id`,`label`,`token_hint`,`reusable`,`created_at`,`created_by`,`expires_at`,`revoked_at`)
VALUES
  ('invite-shared-080911','fcc809c0eb76c85f325634dbb1cfa3c0934a481d76890aea9ebdf4633a52450f','','参与者通用邀请码','080911',1,1787443200000,'owner',NULL,NULL);

PRAGMA optimize;
