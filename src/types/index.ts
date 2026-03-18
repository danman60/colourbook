// Database types matching Supabase schema exactly

export type UserRole = 'user' | 'admin';
export type BookStatus = 'draft' | 'complete' | 'ordered';
export type GenerationStatus = 'pending' | 'generating' | 'complete' | 'failed';
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'printing' | 'shipped' | 'delivered' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  generation_credits: number;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  original_photo_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  status: BookStatus;
  page_count: number;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  user_id: string;
  family_member_id: string | null;
  prompt: string;
  scene_description: string | null;
  original_image_url: string | null;
  coloring_page_url: string | null;
  thumbnail_url: string | null;
  generation_status: GenerationStatus;
  generation_error: string | null;
  openai_request_id: string | null;
  created_at: string;
}

export interface BookPage {
  id: string;
  book_id: string;
  page_id: string;
  page_order: number;
  created_at: string;
  // Joined
  page?: Page;
}

export interface Order {
  id: string;
  user_id: string;
  book_id: string;
  print_partner_id: string;
  status: OrderStatus;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  amount_cents: number;
  currency: string;
  shipping_name: string;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_province: string;
  shipping_postal_code: string;
  shipping_country: string;
  tracking_number: string | null;
  estimated_delivery: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  book?: Book;
  print_partner?: PrintPartner;
}

export interface PrintPartner {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string | null;
  website_url: string | null;
  region_id: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  is_active: boolean;
  price_per_book_cents: number;
  price_per_extra_page_cents: number;
  shipping_flat_rate_cents: number;
  turnaround_days: number;
  created_at: string;
  // Joined
  region?: Region;
}

export interface Region {
  id: string;
  name: string;
  country: string;
  province: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PromptSuggestion {
  id: string;
  category: string;
  prompt_text: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// Insert types (omit auto-generated fields)
export type CreateFamilyMember = Pick<FamilyMember, 'name' | 'relationship' | 'original_photo_url'>;
export type UpdateFamilyMember = Partial<Pick<FamilyMember, 'name' | 'relationship'>>;
export type CreateBook = Pick<Book, 'title' | 'description'>;
export type UpdateBook = Partial<Pick<Book, 'title' | 'description' | 'cover_image_url' | 'status'>>;
export type CreatePage = Pick<Page, 'prompt' | 'family_member_id' | 'original_image_url'>;
export type CreateOrder = Pick<Order, 'book_id' | 'print_partner_id' | 'shipping_name' | 'shipping_address_line1' | 'shipping_address_line2' | 'shipping_city' | 'shipping_province' | 'shipping_postal_code' | 'shipping_country'>;
export type CreatePrintPartner = Omit<PrintPartner, 'id' | 'created_at' | 'region'>;
export type UpdatePrintPartner = Partial<CreatePrintPartner>;
export type CreateRegion = Pick<Region, 'name' | 'country' | 'province'>;
export type CreatePromptSuggestion = Pick<PromptSuggestion, 'category' | 'prompt_text' | 'sort_order'>;

// Action result type
export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}
