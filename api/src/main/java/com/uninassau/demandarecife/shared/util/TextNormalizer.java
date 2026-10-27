package com.uninassau.demandarecife.shared.util;

import java.text.Normalizer;

public final class TextNormalizer {
    private TextNormalizer() {}

    public static String normalize(String s) {
        if (s == null) return "";
        return Normalizer.normalize(s.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")   // remove acentos
                .toLowerCase()
                .replaceAll("\\s+", " ");
    }
}
