-- 004 — Performance: covering indexes for unindexed foreign keys (advisor).
-- Non-destructive; improves joins and FK-cascade performance. Applied to prod via MCP.
CREATE INDEX IF NOT EXISTS idx_cb_book_pages_page_id ON public.cb_book_pages (page_id);
CREATE INDEX IF NOT EXISTS idx_cb_orders_credit_transaction_id ON public.cb_orders (credit_transaction_id);
CREATE INDEX IF NOT EXISTS idx_cb_orders_print_partner_id ON public.cb_orders (print_partner_id);
CREATE INDEX IF NOT EXISTS idx_cb_print_queue_book_id ON public.cb_print_queue (book_id);
CREATE INDEX IF NOT EXISTS idx_cb_print_queue_order_id ON public.cb_print_queue (order_id);
CREATE INDEX IF NOT EXISTS idx_cb_print_queue_user_id ON public.cb_print_queue (user_id);
