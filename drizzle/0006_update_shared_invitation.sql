DELETE FROM `invitations` WHERE `id` = 'invite-shared-911';
INSERT OR REPLACE INTO `invitations`
  (`id`,`token_hash`,`participant_id`,`label`,`token_hint`,`reusable`,`created_at`,`created_by`,`expires_at`,`revoked_at`)
VALUES
  ('invite-shared-00921','11d8f0988e40c2b9f1e2bffc976476d936ce5ad40fe81877b25fce25a69e36c9','','参与者通用邀请码','00921',1,1787011200000,'owner',NULL,NULL);
PRAGMA optimize;
