package com.sarthak.skillbuilder.config;

/**
 * Simple password utility for training project.
 * Stores and compares passwords as plain text.
 * (Spring Security removed — no BCrypt available)
 */
public class PasswordUtil {

    private PasswordUtil() {}

    public static String encode(String rawPassword) {
        return rawPassword;
    }

    public static boolean matches(String rawPassword, String encoded) {
        if (rawPassword == null || encoded == null) return false;
        return rawPassword.equals(encoded);
    }
}
