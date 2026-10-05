export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYMENT_UNAVAILABLE"
  | "AUTH_UNAVAILABLE"
  | "INTERNAL_ERROR";

export type ApiErrorResponse = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string | null;
  categorySlug: string | null;
  isActive: boolean;
  createdAt: string;
};

export type UserSummary = {
  id: string;
  name: string | null;
  email: string | null;
};

export type CartItemSummary = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryName: string | null;
  isActive: boolean;
  quantity: number;
};

export type CartLine = { productId: string; quantity: number };
export type CartOperation = "add" | "set" | "remove" | "clear";

export type CartMutationRequest = {
  operation: CartOperation;
  productId?: string;
  quantity?: number;
  guestLines: CartLine[];
};

export type CartData = { items: CartItemSummary[]; error: string | null };

export type CheckoutRequest = {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  items: CartLine[];
};

export type AuthSessionSummary = {
  user: UserSummary;
  authenticated: true;
};

export type MobileAuthData = {
  accessToken: string;
  expiresAt: string;
  user: UserSummary;
};

export type ProductListResponse = ApiSuccessResponse<ProductSummary[]>;
export type UserSessionResponse = ApiSuccessResponse<AuthSessionSummary>;
export type CartResponse = ApiSuccessResponse<CartData>;
export type MobileAuthResponse = ApiSuccessResponse<MobileAuthData>;
