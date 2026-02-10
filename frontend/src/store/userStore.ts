import { create } from 'zustand';

interface User {
    id: number;
    user_id: string;
    name: string;
    avatar: string;
    chances: number;
    total_score: number;
}

interface UserState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setToken: (token: string) => void;
    setUser: (user: User) => void;
    updateChances: (chances: number) => void;
    logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token, isAuthenticated: true });
    },
    setUser: (user) => set({ user }),
    updateChances: (chances) => set((state) => {
        if (state.user) {
            return { user: { ...state.user, chances } };
        }
        return {};
    }),
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    },
}));
