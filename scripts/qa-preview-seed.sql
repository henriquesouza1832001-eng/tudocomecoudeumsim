PRAGMA foreign_keys = ON;

INSERT INTO accounts (id, email, password_hash, status, email_verified_at) VALUES
('qa-couple', 'casal.qa@example.test', 'disabled-qa-only', 'active', CURRENT_TIMESTAMP),
('qa-staff', 'equipe.qa@example.test', 'disabled-qa-only', 'active', CURRENT_TIMESTAMP);

INSERT INTO weddings (id, slug, owner_account_id, partner_one_name, partner_two_name, event_date, event_time, timezone, status, site_config_json, published_site_config_json, site_published_at, published_partner_one_name, published_partner_two_name, published_event_date, published_event_time) VALUES
('qa-wedding', 'ana-e-caio-qa', 'qa-couple', 'Ana', 'Caio', '2027-10-16', '16:00', 'America/Sao_Paulo', 'active', '{"theme":"garden","enabledSections":["Eventos","Lista de presentes","Galeria de fotos"],"language":"pt-BR"}', '{"theme":"garden","enabledSections":["Eventos","Lista de presentes","Galeria de fotos"],"language":"pt-BR"}', CURRENT_TIMESTAMP, 'Ana', 'Caio', '2027-10-16', '16:00');

INSERT INTO wedding_memberships (id, wedding_id, account_id, role, status, display_name, profession) VALUES
('qa-couple-membership', 'qa-wedding', 'qa-couple', 'couple_admin', 'active', 'Ana e Caio', 'cerimonialista'),
('qa-staff-membership', 'qa-wedding', 'qa-staff', 'checkin_staff', 'active', 'Equipe QA', 'seguranca');

INSERT INTO guest_groups (id, wedding_id, name, group_type) VALUES
('qa-family', 'qa-wedding', 'Família', 'family'),
('qa-godparents', 'qa-wedding', 'Padrinhos', 'godparent');

INSERT INTO events (id, wedding_id, name, event_type, starts_at, venue_name, address) VALUES
('qa-ceremony', 'qa-wedding', 'Cerimônia', 'ceremony', '2027-10-16T16:00:00-03:00', 'Jardim das Flores', 'Belo Horizonte, MG'),
('qa-reception', 'qa-wedding', 'Recepção', 'reception', '2027-10-16T18:00:00-03:00', 'Casa das Mangueiras', 'Belo Horizonte, MG');

INSERT INTO event_group_access (event_id, group_id) VALUES
('qa-ceremony', 'qa-family'), ('qa-ceremony', 'qa-godparents'), ('qa-reception', 'qa-family'), ('qa-reception', 'qa-godparents');

INSERT INTO membership_event_access (membership_id, event_id) VALUES
('qa-staff-membership', 'qa-ceremony'), ('qa-staff-membership', 'qa-reception');

INSERT INTO guests (id, wedding_id, group_id, invited_by, name, email, phone, access_token_hash, party_size, rsvp_status, guest_type, privacy_choice, source) VALUES
('qa-guest-1', 'qa-wedding', 'qa-family', 'qa-couple', 'Marina Almeida', 'marina.qa@example.test', '+5511999990001', 'qa-token-marina', 2, 'confirmed', 'guest', 'private', 'manual'),
('qa-godparent-1', 'qa-wedding', 'qa-godparents', 'qa-couple', 'Rafael Costa', 'rafael.qa@example.test', '+5511999990002', 'qa-token-rafael', 1, 'confirmed', 'godparent', 'private', 'manual');

INSERT INTO guest_event_authorizations (wedding_id, event_id, guest_id, status, decided_by) VALUES
('qa-wedding', 'qa-ceremony', 'qa-guest-1', 'authorized', 'qa-couple'),
('qa-wedding', 'qa-reception', 'qa-guest-1', 'authorized', 'qa-couple'),
('qa-wedding', 'qa-ceremony', 'qa-godparent-1', 'authorized', 'qa-couple'),
('qa-wedding', 'qa-reception', 'qa-godparent-1', 'authorized', 'qa-couple');

INSERT INTO guest_rsvps (id, wedding_id, event_id, guest_id, status, party_size, dietary_notes) VALUES
('qa-rsvp-1', 'qa-wedding', 'qa-ceremony', 'qa-guest-1', 'confirmed', 2, 'Vegetariano'),
('qa-rsvp-2', 'qa-wedding', 'qa-reception', 'qa-guest-1', 'confirmed', 2, 'Vegetariano'),
('qa-rsvp-3', 'qa-wedding', 'qa-ceremony', 'qa-godparent-1', 'confirmed', 1, ''),
('qa-rsvp-4', 'qa-wedding', 'qa-reception', 'qa-godparent-1', 'confirmed', 1, '');

INSERT INTO godparent_tasks (id, wedding_id, guest_id, title, details, due_at, status) VALUES
('qa-task-1', 'qa-wedding', 'qa-godparent-1', 'Confirmar horário das fotos', 'Chegar 30 minutos antes da cerimônia.', '2027-10-16T15:30:00-03:00', 'open');

INSERT INTO gifts (id, wedding_id, gift_type, title, description, amount_cents, status, display_order, fulfillment_type, store_url) VALUES
('qa-gift-pix', 'qa-wedding', 'fixed', 'Cota para a lua de mel', 'Um brinde especial para a viagem.', 15000, 'active', 0, 'pix_direct', NULL),
('qa-gift-store', 'qa-wedding', 'custom', 'Jogo de jantar', 'Para a casa nova.', NULL, 'active', 1, 'store_link', 'https://example.com/presente');

INSERT INTO wedding_expenses (id, wedding_id, supplier_name, supplier_contact, category, description, total_amount_cents, due_date, reminder_enabled, status, created_by) VALUES
('qa-expense-1', 'qa-wedding', 'Jardim das Flores', 'fornecedor@example.test', 'Local', 'Cerimônia e recepção', 850000, '2027-01-15', 0, 'active', 'qa-couple');

INSERT INTO wedding_expense_payments (id, wedding_id, expense_id, amount_cents, paid_at, notes, created_by) VALUES
('qa-expense-payment-1', 'qa-wedding', 'qa-expense-1', 250000, '2026-09-01', 'Sinal demonstrativo', 'qa-couple');

INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json) VALUES
('qa-audit-1', 'qa-couple', 'qa-wedding', 'qa_fixture_seeded', 'wedding', 'qa-wedding', '{"fixture":true}');
