package com.uninassau.demandarecife.push.support;

/** Monta o JSON da notificação sem depender de biblioteca (3 campos simples). */
public final class PushPayload {

    private PushPayload() {}

    public static String of(String title, String body, String tag) {
        return "{\"title\":\"" + escape(title) + "\",\"body\":\"" + escape(body)
                + "\",\"tag\":\"" + escape(tag) + "\"}";
    }

    static String escape(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> sb.append(c < 0x20 ? String.format("\\u%04x", (int) c) : String.valueOf(c));
            }
        }
        return sb.toString();
    }
}