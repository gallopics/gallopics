import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Photo } from '../types';

interface CartContextType {
    cart: CartItem[];
    addToCart: (photo: Photo, quality: string, qualityLabel: string, price: number) => void;
    removeFromCart: (cartId: string) => void;
    removeFromCartByPhotoId: (photoId: string) => void;
    clearCart: () => void;
    total: number;
    isInCart: (photoId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    useEffect(() => {
        localStorage.setItem('gallopics_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (photo: Photo, quality: string, qualityLabel: string, price: number) => {
        setCart(prev => {
            // Prevent duplicates
            const exists = prev.some(item => item.photoId === photo.id && item.quality === quality);
            if (exists) return prev;

            const newItem: CartItem = {
                cartId: Math.random().toString(36).substr(2, 9),
                photoId: photo.id,
                photo,
                quality,
                qualityLabel,
                price
            };
            return [...prev, newItem];
        });
    };

    const removeFromCart = (cartId: string) => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
    };

    const removeFromCartByPhotoId = (photoId: string) => {
        setCart(prev => prev.filter(item => item.photoId !== photoId));
    };

    const clearCart = () => setCart([]);

    const total = cart.reduce((sum, item) => sum + item.price, 0);

    const isInCart = (photoId: string) => cart.some(item => item.photoId === photoId);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, removeFromCartByPhotoId, clearCart, total, isInCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
