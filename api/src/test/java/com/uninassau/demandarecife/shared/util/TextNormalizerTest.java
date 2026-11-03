package com.uninassau.demandarecife.shared.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TextNormalizerTest {

    @Test
    void removeAcentosEPoeEmMinusculo() {
        assertThat(TextNormalizer.normalize("Pão Francês")).isEqualTo("pao frances");
    }

    @Test
    void removeEspacosNasPontasEDuplicados() {
        assertThat(TextNormalizer.normalize("  Pão    de   queijo ")).isEqualTo("pao de queijo");
    }

    @Test
    void nuloViraStringVazia() {
        assertThat(TextNormalizer.normalize(null)).isEmpty();
    }
}
