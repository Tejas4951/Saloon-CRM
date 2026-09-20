package com.management.util;

import java.util.Map;

public class EmailContextHolder {
    private static final ThreadLocal<Map<String, Object>> context = new ThreadLocal<>();

    public static void setModel(Map<String, Object> model) {
        context.set(model);
    }

    public static Map<String, Object> getModel() {
        return context.get();
    }

    public static void clear() {
        context.remove(); // Always call this after use (to prevent memory leaks)
    }
}
