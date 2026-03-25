import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { productId, product, quantity, price }
      
      addItem: (product, quantity = 1) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.productId === product.id);
          
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                product,
                quantity,
                price: product.price,
              },
            ],
          };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.productId !== productId),
            };
          }
          
          return {
            items: state.items.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            ),
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        const state = get();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      },

      getSubtotal: () => {
        const state = get();
        return state.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getTax: () => {
        const subtotal = get().getSubtotal();
        return subtotal * 0.18; // 18% GST
      },

      getDeliveryFee: () => {
        const subtotal = get().getSubtotal();
        return subtotal >= 500 ? 0 : 40; // Free delivery over ₹500
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTax();
        const deliveryFee = get().getDeliveryFee();
        return subtotal + tax + deliveryFee;
      },
    }),
    {
      name: 'dukaansync-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCartStore;
