// Credit costs per action — separated from server actions so it can be imported by both
// server actions and API routes without triggering "use server" constraints.

export const CREDIT_COSTS: Record<string, { credits: number; costCents: number }> = {
  generate_page: { credits: 1, costCents: 4 },
  regenerate_page: { credits: 1, costCents: 4 },
  finalize_book: { credits: 2, costCents: 0 },
  download_pdf: { credits: 3, costCents: 0 },
  print_ship: { credits: 15, costCents: 1200 },
};
