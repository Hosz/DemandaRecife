package com.uninassau.demandarecife.sales.dto;

import java.util.List;

public record ImportResult(int totalLinhas, int importadas, List<RowError> erros) {}
