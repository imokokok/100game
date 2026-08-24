-- 把字面量邀请码 "911" 设为可用：token_hash = SHA256('911')，
-- 可重复使用(reusable=1)、永不失效(expires_at=NULL)、未撤销(revoked_at=NULL)；幂等。
-- 注意：每条 INSERT 已压成单行，避免 Monaco 把裸 VALUES 切成不完整语句。

INSERT INTO participants (id, display_code, locale, created_at, last_active_at, activity_count) VALUES ('00000000-0000-0000-0000-000000000911', '911-shared', 'zh', floor(extract(epoch from now()) * 1000)::bigint, NULL, 0) ON CONFLICT (id) DO NOTHING;

INSERT INTO invitations (id, token_hash, participant_id, label, token_hint, reusable, created_at, created_by, expires_at, revoked_at) VALUES (gen_random_uuid(), 'a5ccb1c538e34663a658b1be28b16455ee5285efb10e6f1d4caba1f69ec9782b', '00000000-0000-0000-0000-000000000911', 'Fixed code 911', '...911', 1, floor(extract(epoch from now()) * 1000)::bigint, 'system', NULL, NULL) ON CONFLICT (token_hash) DO NOTHING;

SELECT id, token_hint, reusable, revoked_at, expires_at FROM invitations WHERE token_hash = 'a5ccb1c538e34663a658b1be28b16455ee5285efb10e6f1d4caba1f69ec9782b';
