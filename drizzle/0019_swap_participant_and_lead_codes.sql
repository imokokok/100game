DELETE FROM `invitations`
WHERE `id` IN ('invite-shared-080911','invite-shared-911');

INSERT INTO `invitations`
  (`id`,`token_hash`,`participant_id`,`label`,`token_hint`,`reusable`,`created_at`,`created_by`,`expires_at`,`revoked_at`)
VALUES
  ('invite-shared-911','a5ccb1c538e34663a658b1be28b16455ee5285efb10e6f1d4caba1f69ec9782b','','参与者通用邀请码','911',1,1787443200000,'owner',NULL,NULL);

PRAGMA optimize;
