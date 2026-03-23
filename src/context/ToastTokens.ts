export const TOAST_TOKENS = {
    DELETE: { type: 'success' as const, accent: '#22c55e', hasUndo: true },
    MOVE: { type: 'success' as const, accent: '#22c55e', hasUndo: true },
    RESET: { type: 'info' as const, accent: '#3b82f6', hasUndo: true },
    PUBLISH: { type: 'success' as const, accent: '#22c55e', hasUndo: false }
};

export const getToastVariant = (action: keyof typeof TOAST_TOKENS) => {
    return TOAST_TOKENS[action];
};
