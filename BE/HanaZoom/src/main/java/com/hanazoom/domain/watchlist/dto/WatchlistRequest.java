package com.hanazoom.domain.watchlist.dto;

import com.hanazoom.domain.watchlist.entity.AlertType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistRequest {

    @NotNull(message = "종목코드는 필수입니다")
    @Pattern(regexp = "^[0-9]{6}$", message = "종목코드는 6자리 숫자여야 합니다")
    private String stockSymbol;

    private BigDecimal alertPrice;

    private AlertType alertType;
}
