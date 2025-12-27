export interface CartItem {
  productId: number;
  productName: string;
  productSku: string;
  price: number;
  taxRate: number;
  quantity: number;
  imageUrl?: string;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  itemCount: number;
}

const CART_STORAGE_KEY = 'apyvyra_cart';

export const cartService = {
  getCart(): CartItem[] {
    try {
      const cartData = localStorage.getItem(CART_STORAGE_KEY);
      return cartData ? JSON.parse(cartData) : [];
    } catch {
      return [];
    }
  },

  saveCart(items: CartItem[]): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  },

  addItem(item: Omit<CartItem, 'quantity'>, quantity: number = 1): CartItem[] {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(i => i.productId === item.productId);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({ ...item, quantity });
    }

    this.saveCart(cart);
    return cart;
  },

  updateQuantity(productId: number, quantity: number): CartItem[] {
    const cart = this.getCart();
    const index = cart.findIndex(i => i.productId === productId);

    if (index >= 0) {
      if (quantity <= 0) {
        cart.splice(index, 1);
      } else {
        cart[index].quantity = quantity;
      }
    }

    this.saveCart(cart);
    return cart;
  },

  removeItem(productId: number): CartItem[] {
    const cart = this.getCart().filter(i => i.productId !== productId);
    this.saveCart(cart);
    return cart;
  },

  clearCart(): void {
    localStorage.removeItem(CART_STORAGE_KEY);
  },

  getCartSummary(): CartSummary {
    const items = this.getCart();
    
    let subtotal = 0;
    let taxAmount = 0;
    let itemCount = 0;

    items.forEach(item => {
      const lineSubtotal = item.price * item.quantity;
      const lineTax = lineSubtotal * (item.taxRate / 100);
      subtotal += lineSubtotal;
      taxAmount += lineTax;
      itemCount += item.quantity;
    });

    return {
      items,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      itemCount,
    };
  },

  getItemCount(): number {
    return this.getCart().reduce((sum, item) => sum + item.quantity, 0);
  },
};
